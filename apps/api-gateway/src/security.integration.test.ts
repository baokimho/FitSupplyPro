import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { requireGatewaySecret } from "@shared/utils";
import type { ClientRequest } from "http";
import type { Request } from "express";

vi.mock("./middleware/auth.middleware.js", () => ({
  authMiddleware: (req: Request, _res: express.Response, next: express.NextFunction) => {
    req.user = {
      id: req.get("x-test-user-id") ?? "customer-1",
      role: req.get("x-test-user-role") ?? "CUSTOMER",
    };
    next();
  },
}));

const proxyHandler = (service: string) => (req: Request, res: express.Response) => {
  res.status(200).json({
    service,
    userId: req.user?.id,
    userRole: req.user?.role,
  });
};

vi.mock("./proxy/authProxy.proxy.js", () => ({ authProxy: proxyHandler("auth") }));
vi.mock("./proxy/cartProxy.proxy.js", () => ({ cartProxy: proxyHandler("cart") }));
vi.mock("./proxy/catalogProxy.proxy.js", () => ({ catalogProxy: proxyHandler("catalog") }));
vi.mock("./proxy/inventoryProxy.proxy.js", () => ({ inventoryProxy: proxyHandler("inventory") }));
vi.mock("./proxy/notificationProxy.proxy.js", () => ({ notificationProxy: proxyHandler("notification") }));
vi.mock("./proxy/orderProxy.proxy.js", () => ({ orderProxy: proxyHandler("order") }));
vi.mock("./proxy/paymentProxy.proxy.js", () => ({ paymentProxy: proxyHandler("payment") }));
vi.mock("./proxy/shippingProxy.proxy.js", () => ({ shippingProxy: proxyHandler("shipping") }));

const { default: router } = await import("./routes.js");
const { attachUserHeaders } = await import("./proxy/userHeaders.proxy.js");

function createGatewayApp() {
  const app = express();
  app.use(express.json());
  app.use(router);
  return app;
}

class HeaderCapture {
  public headers = new Map<string, string | number | readonly string[]>();

  setHeader(name: string, value: string | number | readonly string[]) {
    this.headers.set(name.toLowerCase(), value);
    return this;
  }

  removeHeader(name: string) {
    this.headers.delete(name.toLowerCase());
  }
}

describe("api-gateway security boundaries", () => {
  beforeEach(() => {
    process.env.GATEWAY_SECRET = "test-gateway-secret";
  });

  it("blocks customer catalog product mutations but allows admin", async () => {
    const app = createGatewayApp();

    await request(app).post("/catalog/products").expect(403);
    await request(app).put("/catalog/products/product-1").expect(403);
    await request(app).delete("/catalog/products/product-1").expect(403);
    await request(app).patch("/catalog/products/product-1/publish").expect(403);

    await request(app).post("/catalog/products").set("x-test-user-role", "ADMIN").expect(200);
  });

  it("blocks customer inventory, payment, and shipping state mutations", async () => {
    const app = createGatewayApp();

    await request(app).post("/inventory/products/product-1/adjust").expect(403);
    await request(app).post("/shipping/shipments").expect(403);
    await request(app).patch("/payment/payments/payment-1/confirm").expect(403);
    await request(app).patch("/shipping/shipments/shipment-1/status").send({ status: "SHIPPED" }).expect(403);
    await request(app).patch("/shipping/shipments/shipment-1/status").send({ status: "DELIVERED" }).expect(403);
  });

  it("keeps normal customer routes reachable", async () => {
    const app = createGatewayApp();

    await request(app).get("/catalog/products").expect(200);
    await request(app).get("/cart").expect(200);
    await request(app).post("/order/checkout").expect(200);
    await request(app).get("/payment/payments/me").expect(200);
    await request(app).get("/shipping/shipments/me").expect(200);
    await request(app).get("/notification/notifications/me").expect(200);
  });

  it("blocks public proxy access to service internal routes", async () => {
    const app = createGatewayApp();

    await request(app).post("/notification/internal/notifications").expect(403);
  });

  it("overwrites spoofable identity and internal headers before proxying", () => {
    const proxyReq = new HeaderCapture();
    proxyReq.setHeader("x-user-id", "spoofed-user");
    proxyReq.setHeader("x-user-role", "ADMIN");
    proxyReq.setHeader("x-internal-secret", "spoofed-secret");

    attachUserHeaders(proxyReq as unknown as ClientRequest, {
      user: { id: "customer-1", role: "CUSTOMER" },
    } as Request);

    expect(proxyReq.headers.get("x-user-id")).toBe("customer-1");
    expect(proxyReq.headers.get("x-user-role")).toBe("CUSTOMER");
    expect(proxyReq.headers.get("x-internal-secret")).toBe("test-gateway-secret");
  });

  it("allows direct internal calls only with the shared gateway secret", async () => {
    const app = express();
    app.use(express.json());
    app.use(requireGatewaySecret);
    app.post("/internal/notifications", (_req, res) => res.status(201).json({ ok: true }));

    await request(app).post("/internal/notifications").expect(403);
    await request(app).post("/internal/notifications").set("x-internal-secret", "wrong").expect(403);
    await request(app)
      .post("/internal/notifications")
      .set("x-internal-secret", "test-gateway-secret")
      .expect(201);
  });
});
