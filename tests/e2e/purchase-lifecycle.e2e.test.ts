import { describe, expect, it } from "vitest";

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
    method,
    headers: {
      ...(options.body === undefined ? {} : { "content-type": "application/json" }),
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers ?? {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  const expected = options.expected ?? (method === "POST" ? 201 : 200);

  if (response.status !== expected) {
    throw new Error(`${method} ${path} returned ${response.status}, expected ${expected}: ${text}`);
  }

  return data as T;
}

async function expectStatus(method: string, path: string, status: number, token: string, body?: unknown, headers?: Record<string, string>) {
  const response = await fetch(`${gatewayUrl}${path}`, {
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

  const order = await requestJson<{
    id: string;
    userId: string;
    status: string;
    delivery: Delivery;
  }>("POST", "/order/orders/checkout", {
    token: customerToken,
    headers: { "Idempotency-Key": `checkout-${suffix}` },
    body: {
      cartItemIds: [cart.items[0]?.id],
      delivery,
    },
  });

  const retry = await requestJson<{ id: string }>("POST", "/order/orders/checkout", {
    token: customerToken,
    headers: { "Idempotency-Key": `checkout-${suffix}` },
    body: {
      cartItemIds: [cart.items[0]?.id],
      delivery,
    },
  });

  expect(retry.id).toBe(order.id);
  return order;
}

describe("cross-service purchase lifecycle through api-gateway", () => {
  it("runs happy path from auth to delivered shipment with notifications", async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const admin = await login(adminEmail, adminPassword);
    const customer = await registerCustomer(`customer-${suffix}@example.test`);
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

    const paid = await requestJson<{ status: string }>("PATCH", `/payment/payments/${payment.id}/confirm`, {
      token: admin.accessToken,
      expected: 200,
    });
    expect(paid.status).toBe("PAID");

    const confirmedOrder = await requestJson<{ status: string }>("GET", `/order/orders/${order.id}`, {
      token: customer.accessToken,
      expected: 200,
    });
    expect(confirmedOrder.status).toBe("CONFIRMED");

    const consumed = await requestJson<{ stock: number; reservedStock: number; availableStock: number }>(
      "GET",
      `/inventory/products/${productId}`,
      { token: admin.accessToken, expected: 200 },
    );
    expect(consumed).toMatchObject({ stock: 7, reservedStock: 0, availableStock: 7 });

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
    await requestJson("PATCH", `/shipping/shipments/${shipment.id}/status`, {
      token: admin.accessToken,
      expected: 200,
      body: { status: "DELIVERED" },
    });

    const notifications = await requestJson<{ items: Array<{ type: string }> }>("GET", "/notification/notifications/me", {
      token: customer.accessToken,
      expected: 200,
    });
    const types = notifications.items.map((item) => item.type);
    expect(types).toContain("ORDER_SHIPPED");
    expect(types).toContain("ORDER_DELIVERED");
  });

  it("cancels order and releases reservation after payment failure", async () => {
    const suffix = `fail-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const admin = await login(adminEmail, adminPassword);
    const customer = await registerCustomer(`customer-${suffix}@example.test`);
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

    const cancelledOrder = await requestJson<{ status: string }>("GET", `/order/orders/${order.id}`, {
      token: customer.accessToken,
      expected: 200,
    });
    expect(cancelledOrder.status).toBe("CANCELLED");

    const inventory = await requestJson<{ stock: number; reservedStock: number; availableStock: number }>(
      "GET",
      `/inventory/products/${productId}`,
      { token: admin.accessToken, expected: 200 },
    );
    expect(inventory).toMatchObject({ stock: 10, reservedStock: 0, availableStock: 10 });

    await expectStatus("POST", "/shipping/shipments", 400, admin.accessToken, { orderId: order.id });
  });

  it("preserves gateway security boundaries in the running stack", async () => {
    const suffix = `security-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const customer = await registerCustomer(`customer-${suffix}@example.test`);
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
});
