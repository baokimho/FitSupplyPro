import { execFileSync } from "node:child_process";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const gatewayUrl = process.env.API_GATEWAY_URL ?? "http://localhost:3500";
const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "admin.e2e@fitsupply.test";
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "AdminE2E!12345";

type AuthSession = {
  user: { id: string; email: string; role: "CUSTOMER" | "ADMIN" };
  accessToken: string;
};

type Delivery = {
  recipientName: string;
  contactPhone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  region?: string;
  postalCode: string;
  countryCode: string;
};

async function requestJson<T>(
  method: string,
  path: string,
  options: { token?: string; body?: unknown; headers?: Record<string, string>; expected?: number } = {},
): Promise<T> {
  const response = await fetch(`${gatewayUrl}${path}`, {
    signal: AbortSignal.timeout(5000),
    method,
    headers: {
      ...(options.body === undefined ? {} : { "content-type": "application/json" }),
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers ?? {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await response.text();
  expect(response.headers.get("x-request-id")).toMatch(/^[0-9a-f-]{36}$/i);
  expect(response.headers.get("access-control-expose-headers")).toContain("x-request-id");
  const data = text ? JSON.parse(text) : {};
  const expected = options.expected ?? (method === "POST" ? 201 : 200);

  if (response.status !== expected) {
    throw new Error(`${method} ${path} returned ${response.status}, expected ${expected}: ${text}`);
  }

  return data as T;
}

async function expectStatus(method: string, path: string, status: number, token: string, body?: unknown, headers?: Record<string, string>) {
  const response = await fetch(`${gatewayUrl}${path}`, {
    signal: AbortSignal.timeout(5000),
    method,
    headers: {
      ...(body === undefined ? {} : { "content-type": "application/json" }),
      authorization: `Bearer ${token}`,
      ...(headers ?? {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  expect(response.status).toBe(status);
}

async function registerCustomer(email: string): Promise<AuthSession> {
  return requestJson<AuthSession>("POST", "/auth/register", {
    body: {
      email,
      password: "CustomerE2E!12345",
      name: "E2E Customer",
    },
  });
}

async function login(email: string, password: string): Promise<AuthSession> {
  return requestJson<AuthSession>("POST", "/auth/login", {
    body: { email, password },
    expected: 200,
  });
}

async function createCatalog(adminToken: string, suffix: string) {
  const category = await requestJson<{ data: { id: string } }>("POST", "/catalog/categories", {
    token: adminToken,
    body: {
      name: `E2E Category ${suffix}`,
      slug: `e2e-category-${suffix}`,
    },
  });
  const brand = await requestJson<{ data: { id: string } }>("POST", "/catalog/brands", {
    token: adminToken,
    body: {
      name: `E2E Brand ${suffix}`,
      slug: `e2e-brand-${suffix}`,
    },
  });
  const product = await requestJson<{ data: { id: string } }>("POST", "/catalog/products", {
    token: adminToken,
    body: {
      name: `E2E Product ${suffix}`,
      slug: `e2e-product-${suffix}`,
      description: "E2E product",
      sku: `E2E-SKU-${suffix}`,
      price: 12.5,
      images: [],
      isPublished: false,
      categoryId: category.data.id,
      brandId: brand.data.id,
    },
  });
  await requestJson("PATCH", `/catalog/products/${product.data.id}/publish`, { token: adminToken, expected: 200 });
  await requestJson("POST", "/inventory", {
    token: adminToken,
    body: {
      productId: product.data.id,
      stock: 10,
      lowStockThreshold: 1,
    },
  });

  return product.data.id;
}

async function checkout(customerToken: string, productId: string, suffix: string, delivery: Delivery) {
  const cart = await requestJson<{ items: Array<{ id: string; productId: string; quantity: number }> }>("POST", "/cart/items", {
    token: customerToken,
    body: { productId, quantity: 3 },
  });
  const item = cart.items.find((entry) => entry.productId === productId);
  if (!item) throw new Error("Missing checkout product");

  const order = await requestJson<{
    id: string;
    userId: string;
    status: string;
    delivery: Delivery;
  }>("POST", "/order/orders/checkout", {
    token: customerToken,
    headers: { "Idempotency-Key": `checkout-${suffix}` },
    body: {
      cartItemIds: [item.id],
      delivery,
    },
  });

  const retry = await requestJson<{ id: string }>("POST", "/order/orders/checkout", {
    token: customerToken,
    headers: { "Idempotency-Key": `checkout-${suffix}` },
    body: {
      cartItemIds: [item.id],
      delivery,
    },
  });

  expect(retry.id).toBe(order.id);
  return order;
}

describe("cross-service purchase lifecycle through api-gateway", () => {
  let adminSession: AuthSession;
  let customerSession: AuthSession;
  let otherSession: AuthSession;

  beforeAll(async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    adminSession = await login(adminEmail, adminPassword);
    customerSession = await registerCustomer(`customer-${suffix}@example.test`);
    otherSession = await registerCustomer(`other-${suffix}@example.test`);
  });
  beforeEach(async () => {
    for (const session of [customerSession, otherSession]) await requestJson("DELETE", "/cart", { token: session.accessToken });
  });

  it("Cart quantities and advisory prices never override Catalog checkout snapshots", async () => {
    const productId = await createCatalog(adminSession.accessToken, `cart-price-${Date.now()}`);
    type Cart = { items: Array<{ id: string; productId: string; quantity: number; unitPrice: number }> };
    const added = await requestJson<Cart>("POST", "/cart/items", { token: customerSession.accessToken, body: { productId, quantity: 2 } });
    const item = added.items.find((entry) => entry.productId === productId)!;
    await requestJson("PATCH", `/cart/items/${item.id}`, { token: customerSession.accessToken, body: { quantity: 3 } });
    await requestJson("PUT", `/catalog/products/${productId}`, { token: adminSession.accessToken, body: { price: 20 } });
    const stale = await requestJson<Cart>("GET", "/cart", { token: customerSession.accessToken });
    expect(stale.items.find((entry) => entry.id === item.id)).toMatchObject({ quantity: 3, unitPrice: 12.5 });
    await requestJson("PATCH", `/catalog/products/${productId}/unpublish`, { token: adminSession.accessToken });
    const body = { cartItemIds: [item.id], delivery: { recipientName: "Cart Buyer", contactPhone: "+358401234567", addressLine1: "Street 1", city: "Helsinki", postalCode: "00100", countryCode: "FI" } };
    await expectStatus("POST", "/order/orders/checkout", 400, customerSession.accessToken, body, { "Idempotency-Key": `stale:${productId}` });
    expect((await requestJson<Cart>("GET", "/cart", { token: customerSession.accessToken })).items).toHaveLength(1);
    await requestJson("PATCH", `/catalog/products/${productId}/publish`, { token: adminSession.accessToken });
    const order = await requestJson<{ id: string; totalAmount: number; items: Array<{ quantity: number; unitPrice: number }> }>("POST", "/order/orders/checkout", {
      token: customerSession.accessToken, body, headers: { "Idempotency-Key": `current:${productId}` },
    });
    expect(order).toMatchObject({ totalAmount: 60, items: [{ quantity: 3, unitPrice: 20 }] });
    expect((await requestJson<Cart>("GET", "/cart", { token: customerSession.accessToken })).items).toEqual([]);
    await requestJson("PATCH", `/order/orders/${order.id}/cancel`, { token: customerSession.accessToken });
  });

  it("sync checkout and lifecycle continue during Notification outage; email resumes after restart", async () => {
    const compose = ["compose", "-p", "fitsupply-e2e", "-f", "docker-compose.test.yml"];
    const suffix = `notification-outage-${Date.now()}`;
    const productId = await createCatalog(adminSession.accessToken, suffix);
    const delivery = { recipientName: "Notification Outage", contactPhone: "+358401234567", addressLine1: "Street 1", city: "Helsinki", postalCode: "00100", countryCode: "FI" };
    let orderId: string | undefined;
    execFileSync("docker", [...compose, "stop", "notification-service"], { timeout: 20000, stdio: "pipe" });
    try {
      const order = await checkout(customerSession.accessToken, productId, suffix, delivery);
      orderId = order.id;
      expect(order.status).toBe("PENDING");
      expect(await requestJson("PATCH", `/order/orders/${order.id}/confirm`, { token: adminSession.accessToken })).toMatchObject({ status: "CONFIRMED" });
      expect(await requestJson("PATCH", `/order/orders/${order.id}/cancel`, { token: customerSession.accessToken })).toMatchObject({ status: "CANCELLED" });
    } finally {
      execFileSync("docker", [...compose, "start", "--wait", "--wait-timeout", "60", "notification-service"], { timeout: 70000, stdio: "pipe" });
    }
    if (!orderId) throw new Error("Outage checkout did not complete");
    const completedOrderId = orderId;
    await vi.waitFor(() => {
      const result = execFileSync("docker", [...compose, "exec", "-T", "postgres-test", "psql", "-U", "fitsupply_test", "-d", "notification_test_db", "-At", "-v", "ON_ERROR_STOP=1", "-c",
        `SELECT count(*) FROM "NotificationDelivery" d JOIN "Notification" n ON n.id=d."notificationId" JOIN "FakeEmailReceipt" f ON f."deliveryKey"='delivery:'||d.id
        WHERE n.message LIKE '%${completedOrderId}%' AND d.status='SENT' AND d."attemptCount"=1`], { encoding: "utf8", timeout: 10000 });
      expect(result.trim()).toBe("2");
    }, { timeout: 10000, interval: 100 });
  }, 90000);

  it("enforces Order lifecycle and ownership independently of Payment", async () => {
    const suffix = `order-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const admin = adminSession;
    const customer = customerSession;
    const other = otherSession;
    const productId = await createCatalog(admin.accessToken, suffix);
    const delivery = { recipientName: "Order Domain", contactPhone: "+358 40 1234567", addressLine1: "Street 1", city: "Helsinki", postalCode: "00100", countryCode: "FI" };
    const create = () => requestJson<{ id: string; status: string; userId: string; totalAmount: number; items: Array<{ quantity: number }> }>("POST", "/order/orders", {
      token: customer.accessToken,
      body: { userId: other.user.id, totalAmount: 0, status: "DELIVERED", delivery,
        items: [{ productId, quantity: 1, unitPrice: 0 }, { productId, quantity: 2 }] },
    });
    const order = await create();
    expect(order).toMatchObject({ status: "PENDING", userId: customer.user.id, totalAmount: 37.5 });
    expect(order.items).toHaveLength(1);
    expect(order.items[0].quantity).toBe(3);
    await expectStatus("GET", `/order/orders/${order.id}`, 403, other.accessToken);
    await expectStatus("PATCH", `/order/orders/${order.id}/cancel`, 403, other.accessToken);
    const spoofedIdentity = { "x-user-id": customer.user.id, "x-user-role": "ADMIN", "x-internal-secret": "fitsupply_test_internal_secret" };
    const anonymous = await requestJson("GET", `/order/orders/${order.id}`, { headers: spoofedIdentity, expected: 401 });
    expect(anonymous).toEqual({ error: { code: "UNAUTHORIZED", message: "Missing token" } });
    await expectStatus("PATCH", `/order/orders/${order.id}/cancel`, 403, other.accessToken, undefined, spoofedIdentity);
    expect(await requestJson("GET", `/order/orders/${order.id}`, { token: customer.accessToken })).toMatchObject({ userId: customer.user.id, status: "PENDING" });
    for (const command of ["confirm", "process", "ship", "deliver"]) {
      await expectStatus("PATCH", `/order/orders/${order.id}/${command}`, 403, customer.accessToken, undefined, { "x-user-role": "ADMIN" });
    }
    await expectStatus("PATCH", `/order/internal/orders/${order.id}/confirm`, 403, admin.accessToken);
    await expectStatus("PATCH", `/order/orders/${order.id}/deliver`, 409, admin.accessToken);
    for (const [command, status] of [["confirm", "CONFIRMED"], ["process", "PROCESSING"], ["ship", "SHIPPED"], ["deliver", "DELIVERED"]]) {
      const response = await requestJson<{ status: string }>("PATCH", `/order/orders/${order.id}/${command}`, { token: admin.accessToken });
      expect(response.status).toBe(status);
      if (status === "PROCESSING") await expectStatus("PATCH", `/order/orders/${order.id}/cancel`, 409, customer.accessToken);
    }
    await expectStatus("PATCH", `/order/orders/${order.id}/ship`, 409, admin.accessToken);
    const cancellable = await create();
    await requestJson("PATCH", `/order/orders/${cancellable.id}/confirm`, { token: admin.accessToken });
    await requestJson("PATCH", `/order/orders/${cancellable.id}/cancel`, { token: customer.accessToken });
    await expectStatus("PATCH", `/order/orders/${cancellable.id}/cancel`, 409, customer.accessToken);
    await expectStatus("PATCH", `/order/orders/${cancellable.id}/confirm`, 409, admin.accessToken);
    const inventory = await requestJson<{ stock: number; reservedStock: number }>("GET", `/inventory/products/${productId}`, { token: admin.accessToken });
    expect(inventory).toMatchObject({ stock: 7, reservedStock: 0 });
  });
  it("reports safe process health and local gateway readiness with correlation", async () => {
    expect(await requestJson("GET", "/health")).toEqual({ status: "ok", service: "api-gateway" });
    expect(await requestJson("GET", "/ready")).toEqual({ status: "ready", service: "api-gateway" });
  });
  it("insufficient stock preserves cart/domain state; restock requires fresh key and succeeds once", async () => {
    const suffix = `insufficient-${Date.now()}`;
    const productId = await createCatalog(adminSession.accessToken, suffix);
    const cart = await requestJson<{ items: Array<{ id: string; productId: string }> }>("POST", "/cart/items", {
      token: customerSession.accessToken, body: { productId, quantity: 11 },
    });
    const item = cart.items.find((entry) => entry.productId === productId);
    if (!item) throw new Error("Missing checkout item");
    const headers = { "Idempotency-Key": suffix };
    const body = { cartItemIds: [item.id], delivery: { recipientName: "Stock Test", contactPhone: "+358401234567", addressLine1: "Street 1", city: "Helsinki", postalCode: "00100", countryCode: "FI" } };
    const before = await requestJson<{ items: Array<{ id: string }> }>("GET", "/order/orders/me", { token: customerSession.accessToken });
    const paymentsBefore = await requestJson<{ items: Array<{ id: string }> }>("GET", "/payment/payments/me", { token: customerSession.accessToken });
    await expectStatus("POST", "/order/orders/checkout", 400, customerSession.accessToken, body, headers);
    await expectStatus("POST", "/order/orders/checkout", 409, customerSession.accessToken, body, headers);
    expect(await requestJson("GET", `/inventory/products/${productId}`, { token: adminSession.accessToken })).toMatchObject({ stock: 10, reservedStock: 0 });
    const after = await requestJson<{ items: Array<{ id: string }> }>("GET", "/order/orders/me", { token: customerSession.accessToken });
    expect(after.items.map((entry) => entry.id).sort()).toEqual(before.items.map((entry) => entry.id).sort());
    const paymentsAfter = await requestJson<{ items: Array<{ id: string }> }>("GET", "/payment/payments/me", { token: customerSession.accessToken });
    expect(paymentsAfter.items.map((entry) => entry.id).sort()).toEqual(paymentsBefore.items.map((entry) => entry.id).sort());
    const unchanged = await requestJson<{ items: Array<{ id: string }> }>("GET", "/cart", { token: customerSession.accessToken });
    expect(unchanged.items.some((entry) => entry.id === item.id)).toBe(true);
    await requestJson("POST", `/inventory/products/${productId}/adjust`, { token: adminSession.accessToken, body: { quantity: 1, reason: "Test restock" }, expected: 200 });
    await expectStatus("POST", "/order/orders/checkout", 409, customerSession.accessToken, body, headers);
    const freshHeaders = { "Idempotency-Key": `${suffix}:restocked` };
    const order = await requestJson<{ id: string }>("POST", "/order/orders/checkout", { token: customerSession.accessToken, headers: freshHeaders, body });
    const replay = await requestJson<{ id: string }>("POST", "/order/orders/checkout", { token: customerSession.accessToken, headers: freshHeaders, body });
    expect(replay.id).toBe(order.id);
    await requestJson("PATCH", `/order/orders/${order.id}/cancel`, { token: customerSession.accessToken });
    expect(await requestJson("GET", `/inventory/products/${productId}`, { token: adminSession.accessToken })).toMatchObject({ stock: 11, reservedStock: 0 });
  });

  it("runs happy path from auth to delivered shipment with notifications", async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const admin = adminSession;
    const customer = customerSession;
    const productId = await createCatalog(admin.accessToken, suffix);
    const delivery = {
      recipientName: "Kim",
      contactPhone: "+358 40 1234567",
      addressLine1: "Aurakatu 1",
      addressLine2: "A 2",
      city: "Turku",
      region: "Varsinais-Suomi",
      postalCode: "20100",
      countryCode: "FI",
    };

    const order = await checkout(customer.accessToken, productId, suffix, delivery);
    expect(order.status).toBe("PENDING");
    expect(order.userId).toBe(customer.user.id);
    expect(order.delivery).toMatchObject(delivery);

    const reserved = await requestJson<{ stock: number; reservedStock: number; availableStock: number }>(
      "GET",
      `/inventory/products/${productId}`,
      { token: admin.accessToken, expected: 200 },
    );
    expect(reserved).toMatchObject({ stock: 10, reservedStock: 3, availableStock: 7 });

    const payment = await requestJson<{ id: string; status: string; orderId: string }>("POST", "/payment/payments", {
      token: customer.accessToken,
      headers: { "Idempotency-Key": `payment-${suffix}` },
      body: { orderId: order.id },
    });
    const paymentRetry = await requestJson<{ id: string }>("POST", "/payment/payments", {
      token: customer.accessToken,
      headers: { "Idempotency-Key": `payment-${suffix}` },
      body: { orderId: order.id },
    });
    expect(paymentRetry.id).toBe(payment.id);
    const spoofedOwner = { "x-user-id": customer.user.id, "x-user-role": "ADMIN" };
    await expectStatus("GET", `/payment/payments/${payment.id}`, 403, otherSession.accessToken, undefined, spoofedOwner);
    await expectStatus("POST", "/payment/payments", 403, otherSession.accessToken, { orderId: order.id }, { ...spoofedOwner, "Idempotency-Key": `foreign-payment-${suffix}` });
    await expectStatus("PATCH", `/payment/payments/${payment.id}/confirm`, 403, otherSession.accessToken, undefined, spoofedOwner);
    expect(await requestJson("GET", `/payment/payments/${payment.id}`, { token: customer.accessToken })).toMatchObject({ id: payment.id, status: "PENDING" });
    const foreignPayments = await requestJson<{ items: Array<{ id: string }> }>("GET", "/payment/payments/me", { token: otherSession.accessToken });
    expect(foreignPayments.items.some((item) => item.id === payment.id)).toBe(false);

    const paid = await requestJson<{ status: string }>("PATCH", `/payment/payments/${payment.id}/confirm`, {
      token: admin.accessToken,
      expected: 200,
    });
    expect(paid.status).toBe("SUCCEEDED");

    const confirmedOrder = await requestJson<{ status: string }>("GET", `/order/orders/${order.id}`, {
      token: customer.accessToken,
      expected: 200,
    });
    expect(confirmedOrder.status).toBe("CONFIRMED");

    const confirmedInventory = await requestJson<{ stock: number; reservedStock: number }>(
      "GET",
      `/inventory/products/${productId}`,
      { token: admin.accessToken, expected: 200 },
    );
    expect(confirmedInventory).toMatchObject({ stock: 10, reservedStock: 3 });

    const shipment = await requestJson<{
      id: string;
      userId: string;
      orderId: string;
      status: string;
      recipientName: string;
      phone: string;
      addressLine1: string;
      city: string;
      postalCode: string;
      country: string;
    }>("POST", "/shipping/shipments", {
      token: admin.accessToken,
      body: { orderId: order.id },
    });
    expect(shipment).toMatchObject({
      userId: customer.user.id,
      orderId: order.id,
      status: "PROCESSING",
      recipientName: delivery.recipientName,
      phone: delivery.contactPhone,
      addressLine1: delivery.addressLine1,
      city: delivery.city,
      postalCode: delivery.postalCode,
      country: delivery.countryCode,
    });

    const shipmentRetry = await requestJson<{ id: string }>("POST", "/shipping/shipments", {
      token: admin.accessToken,
      body: { orderId: order.id },
    });
    expect(shipmentRetry.id).toBe(shipment.id);
    await expectStatus("GET", `/shipping/shipments/${shipment.id}`, 403, otherSession.accessToken, undefined, spoofedOwner);
    await expectStatus("PATCH", `/shipping/shipments/${shipment.id}/status`, 403, otherSession.accessToken, { status: "SHIPPED", trackingNumber: "FORGED" }, spoofedOwner);
    expect(await requestJson("GET", `/shipping/shipments/${shipment.id}`, { token: customer.accessToken })).toMatchObject({ id: shipment.id, status: "PROCESSING" });
    const foreignShipments = await requestJson<{ items: Array<{ id: string }> }>("GET", "/shipping/shipments/me", { token: otherSession.accessToken });
    expect(foreignShipments.items.some((item) => item.id === shipment.id)).toBe(false);

    await requestJson("PATCH", `/order/orders/${order.id}/process`, { token: admin.accessToken });
    const consumed = await requestJson<{ stock: number; reservedStock: number }>("GET", `/inventory/products/${productId}`, { token: admin.accessToken });
    expect(consumed).toMatchObject({ stock: 7, reservedStock: 0 });

    const myShipments = await requestJson<{ items: Array<{ id: string; orderId: string }> }>("GET", "/shipping/shipments/me", {
      token: customer.accessToken,
      expected: 200,
    });
    expect(myShipments.items.filter((item) => item.orderId === order.id)).toHaveLength(1);

    await requestJson("PATCH", `/shipping/shipments/${shipment.id}/status`, {
      token: admin.accessToken,
      expected: 200,
      body: { status: "SHIPPED", trackingNumber: "TRACK-E2E-1" },
    });
    await requestJson("PATCH", `/order/orders/${order.id}/ship`, { token: admin.accessToken });
    await requestJson("PATCH", `/shipping/shipments/${shipment.id}/status`, {
      token: admin.accessToken,
      expected: 200,
      body: { status: "DELIVERED" },
    });
    const delivered = await requestJson<{ status: string }>("PATCH", `/order/orders/${order.id}/deliver`, { token: admin.accessToken });
    expect(delivered.status).toBe("DELIVERED");

    type Notifications = { items: Array<{ id: string; type: string; isRead: boolean; message: string }> };
    let notifications: Notifications = { items: [] };
    await vi.waitFor(async () => {
      notifications = await requestJson<Notifications>("GET", "/notification/notifications/me", { token: customer.accessToken });
      const types = notifications.items.filter((item) => item.message.includes(shipment.id)).map((item) => item.type);
      expect(types.sort()).toEqual(["ORDER_DELIVERED", "ORDER_SHIPPED"]);
    }, { timeout: 10000, interval: 100 });
    const notification = notifications.items.find((item) => item.type === "ORDER_SHIPPED" && item.message.includes(shipment.id));
    if (!notification) throw new Error("Missing shipped notification");
    expect(notification.isRead).toBe(false);
    await expectStatus("PATCH", `/notification/notifications/${notification.id}/read`, 403, otherSession.accessToken, undefined, spoofedOwner);
    const ownerNotifications = await requestJson<typeof notifications>("GET", "/notification/notifications/me", { token: customer.accessToken });
    expect(ownerNotifications.items.find((item) => item.id === notification.id)?.isRead).toBe(false);
    const foreignNotifications = await requestJson<typeof notifications>("GET", "/notification/notifications/me", { token: otherSession.accessToken });
    expect(foreignNotifications.items.some((item) => item.id === notification.id)).toBe(false);
    expect(await requestJson("PATCH", `/notification/notifications/${notification.id}/read`, { token: customer.accessToken })).toMatchObject({ id: notification.id, isRead: true });
  }, 30000);

  it("Shipping Outbox survives broker outage and process kill, then sends one logical email", async () => {
    const compose = ["compose", "-p", "fitsupply-e2e", "-f", "docker-compose.test.yml"];
    const sql = (database: string, query: string) => execFileSync("docker", [...compose, "exec", "-T", "postgres-test", "psql", "-U", "fitsupply_test", "-d", database,
      "-At", "-v", "ON_ERROR_STOP=1", "-c", query], { encoding: "utf8", timeout: 10000 }).trim();
    const suffix = `shipping-recovery-${Date.now()}`;
    const productId = await createCatalog(adminSession.accessToken, suffix);
    const delivery = { recipientName: "Shipping Recovery", contactPhone: "+358401234567", addressLine1: "Street 1", city: "Helsinki", postalCode: "00100", countryCode: "FI" };
    const order = await checkout(customerSession.accessToken, productId, suffix, delivery);
    await requestJson("PATCH", `/order/orders/${order.id}/confirm`, { token: adminSession.accessToken });
    const shipment = await requestJson<{ id: string }>("POST", "/shipping/shipments", { token: adminSession.accessToken, body: { orderId: order.id } });
    await requestJson("PATCH", `/order/orders/${order.id}/process`, { token: adminSession.accessToken });
    const startedAt = execFileSync("docker", ["inspect", "--format", "{{.State.StartedAt}}", "fitsupply-stack-shipping-service-test"], { encoding: "utf8", timeout: 10000 });
    let sourceEventId = "";
    execFileSync("docker", [...compose, "stop", "rabbitmq-test"], { timeout: 20000, stdio: "pipe" });
    try {
      await requestJson("PATCH", `/shipping/shipments/${shipment.id}/status`, { token: adminSession.accessToken, body: { status: "SHIPPED", trackingNumber: suffix } });
      sourceEventId = sql("shipping_test_db", `SELECT "eventId" FROM "OutboxEvent" WHERE "deduplicationKey"='shipment:${shipment.id}:SHIPPED' AND "publishedAt" IS NULL`);
      expect(sourceEventId).toMatch(/^[0-9a-f-]{36}$/);
      execFileSync("docker", [...compose, "kill", "-s", "SIGKILL", "shipping-service"], { timeout: 10000, stdio: "pipe" });
    } finally {
      execFileSync("docker", [...compose, "start", "--wait", "--wait-timeout", "30", "rabbitmq-test"], { timeout: 40000, stdio: "pipe" });
      execFileSync("docker", [...compose, "start", "--wait", "--wait-timeout", "30", "shipping-service"], { timeout: 40000, stdio: "pipe" });
    }
    expect(execFileSync("docker", ["inspect", "--format", "{{.State.StartedAt}}", "fitsupply-stack-shipping-service-test"], { encoding: "utf8", timeout: 10000 })).not.toBe(startedAt);
    await requestJson("PATCH", `/shipping/shipments/${shipment.id}/status`, { token: adminSession.accessToken, body: { status: "SHIPPED", trackingNumber: suffix } });
    expect(sql("shipping_test_db", `SELECT count(*) FROM "OutboxEvent" WHERE "payload"::jsonb->'data'->>'shipmentId'='${shipment.id}'`)).toBe("1");
    await vi.waitFor(() => {
      expect(sql("shipping_test_db", `SELECT count(*) FROM "OutboxEvent" WHERE "eventId"='${sourceEventId}' AND "publishedAt" IS NOT NULL`)).toBe("1");
      expect(sql("notification_test_db", `SELECT count(*) FROM "Notification" n JOIN "NotificationDelivery" d ON d."notificationId"=n.id
        JOIN "FakeEmailReceipt" f ON f."deliveryKey"='delivery:'||d.id WHERE n."sourceEventId"='${sourceEventId}' AND d.status='SENT' AND d."attemptCount"=1`)).toBe("1");
    }, { timeout: 30000, interval: 100 });
  }, 150000);

  it("payment failure preserves pending Order until explicit customer cancellation", async () => {
    const suffix = `fail-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const admin = adminSession;
    const customer = customerSession;
    const productId = await createCatalog(admin.accessToken, suffix);
    const order = await checkout(customer.accessToken, productId, suffix, {
      recipientName: "Failure Case",
      contactPhone: "+358 40 7654321",
      addressLine1: "Linnankatu 2",
      city: "Turku",
      postalCode: "20100",
      countryCode: "FI",
    });

    const payment = await requestJson<{ id: string }>("POST", "/payment/payments", {
      token: customer.accessToken,
      headers: { "Idempotency-Key": `payment-${suffix}` },
      body: { orderId: order.id },
    });
    const failed = await requestJson<{ status: string }>("PATCH", `/payment/payments/${payment.id}/fail`, {
      token: admin.accessToken,
      expected: 200,
    });
    expect(failed.status).toBe("FAILED");

    const pendingOrder = await requestJson<{ status: string }>("GET", `/order/orders/${order.id}`, {
      token: customer.accessToken,
      expected: 200,
    });
    expect(pendingOrder.status).toBe("PENDING");
    const reserved = await requestJson<{ reservedStock: number }>("GET", `/inventory/products/${productId}`, { token: admin.accessToken });
    expect(reserved.reservedStock).toBe(3);
    const cancelledOrder = await requestJson<{ status: string }>("PATCH", `/order/orders/${order.id}/cancel`, { token: customer.accessToken });
    expect(cancelledOrder.status).toBe("CANCELLED");

    const inventory = await requestJson<{ stock: number; reservedStock: number; availableStock: number }>(
      "GET",
      `/inventory/products/${productId}`,
      { token: admin.accessToken, expected: 200 },
    );
    expect(inventory).toMatchObject({ stock: 10, reservedStock: 0, availableStock: 10 });

    await expectStatus("POST", "/shipping/shipments", 400, admin.accessToken, { orderId: order.id });
  });

  it("retries failed payment attempt, confirms once, and refunds without changing Order", async () => {
    const suffix = `payment-recovery-${Date.now()}`;
    const productId = await createCatalog(adminSession.accessToken, suffix);
    const order = await checkout(customerSession.accessToken, productId, suffix, {
      recipientName: "Payment Recovery", contactPhone: "+358401234567", addressLine1: "Street 1",
      city: "Helsinki", postalCode: "00100", countryCode: "FI",
    });
    type PaymentResult = { id: string; amount: string; status: string; providerPaymentId: string | null };
    const create = (key: string) => requestJson<PaymentResult>("POST", "/payment/payments", {
      token: customerSession.accessToken, headers: { "Idempotency-Key": key }, body: { orderId: order.id },
    });
    const command = (id: string, name: string) => requestJson<PaymentResult>("PATCH", `/payment/payments/${id}/${name}`, { token: adminSession.accessToken });
    const first = await create(`${suffix}-first`);
    expect(first.amount).toBe("37.50");
    expect((await command(first.id, "fail")).status).toBe("FAILED");
    expect((await command(first.id, "fail")).status).toBe("FAILED");
    expect((await create(`${suffix}-first`)).id).toBe(first.id);
    const retry = await create(`${suffix}-retry`);
    expect(retry.id).not.toBe(first.id);
    const succeeded = await command(retry.id, "confirm");
    expect(succeeded.status).toBe("SUCCEEDED");
    expect((await command(retry.id, "confirm")).providerPaymentId).toBe(succeeded.providerPaymentId);
    expect((await command(retry.id, "refund")).status).toBe("REFUNDED");
    expect((await command(retry.id, "refund")).status).toBe("REFUNDED");
    await expectStatus("PATCH", `/payment/payments/${retry.id}/confirm`, 409, adminSession.accessToken);
    const finalOrder = await requestJson<{ status: string }>("GET", `/order/orders/${order.id}`, { token: customerSession.accessToken });
    expect(finalOrder.status).toBe("CONFIRMED");
    const failedAttempt = await requestJson<PaymentResult>("GET", `/payment/payments/${first.id}`, { token: customerSession.accessToken });
    expect(failedAttempt.status).toBe("FAILED");
  });

  it("preserves gateway security boundaries in the running stack", async () => {
    const customer = customerSession;
    const spoofHeaders = {
      "x-user-id": "another-user",
      "x-user-role": "ADMIN",
      "x-internal-secret": "fitsupply_test_internal_secret",
    };

    await expectStatus("POST", "/catalog/products", 403, customer.accessToken, {}, spoofHeaders);
    await expectStatus("PATCH", "/catalog/products/some-product/publish", 403, customer.accessToken, undefined, spoofHeaders);
    await expectStatus("POST", "/inventory/products/some-product/adjust", 403, customer.accessToken, {
      quantity: 1,
      reason: "spoof",
    }, spoofHeaders);
    await expectStatus("PATCH", "/payment/payments/some-payment/confirm", 403, customer.accessToken, undefined, spoofHeaders);
    await expectStatus("PATCH", "/payment/payments/some-payment/fail", 403, customer.accessToken, undefined, spoofHeaders);
    await expectStatus("PATCH", "/payment/payments/some-payment/refund", 403, customer.accessToken, undefined, spoofHeaders);
    await expectStatus("POST", "/shipping/shipments", 403, customer.accessToken, { orderId: "some-order" }, spoofHeaders);
    await expectStatus("PATCH", "/shipping/shipments/some-shipment/status", 403, customer.accessToken, {
      status: "SHIPPED",
      trackingNumber: "TRACK-SPOOF",
    }, spoofHeaders);
    await expectStatus("POST", "/notification/internal/notifications", 403, customer.accessToken, {
      userId: customer.user.id,
      type: "ORDER_SHIPPED",
      title: "spoof",
      message: "spoof",
    }, spoofHeaders);
  });

  it("keeps cart item mutations scoped to verified owner", async () => {
    const productId = await createCatalog(adminSession.accessToken, `cart-owner-${Date.now()}`);
    type Cart = { userId: string; items: Array<{ id: string; productId: string; quantity: number }> };
    const cart = await requestJson<Cart>("POST", "/cart/items", { token: customerSession.accessToken, body: { productId, quantity: 1 } });
    const item = cart.items.find((entry) => entry.productId === productId);
    if (!item) throw new Error("Missing owner cart item");
    const spoofedOwner = { "x-user-id": customerSession.user.id, "x-user-role": "ADMIN" };
    await expectStatus("PATCH", `/cart/items/${item.id}`, 404, otherSession.accessToken, { quantity: 2 }, spoofedOwner);
    await expectStatus("DELETE", `/cart/items/${item.id}`, 404, otherSession.accessToken, undefined, spoofedOwner);
    const unchanged = await requestJson<Cart>("GET", "/cart", { token: customerSession.accessToken });
    expect(unchanged.items.find((entry) => entry.id === item.id)?.quantity).toBe(1);
    const foreign = await requestJson<Cart>("GET", "/cart", { token: otherSession.accessToken, headers: spoofedOwner });
    expect(foreign.userId).toBe(otherSession.user.id);
    expect(foreign.items.some((entry) => entry.id === item.id)).toBe(false);
    const updated = await requestJson<Cart>("PATCH", `/cart/items/${item.id}`, { token: customerSession.accessToken, body: { quantity: 2 } });
    expect(updated.items.find((entry) => entry.id === item.id)?.quantity).toBe(2);
    const removed = await requestJson<Cart>("DELETE", `/cart/items/${item.id}`, { token: customerSession.accessToken });
    expect(removed.items.some((entry) => entry.id === item.id)).toBe(false);
  });
});
