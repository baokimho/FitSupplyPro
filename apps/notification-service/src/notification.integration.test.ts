import express from "express";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, expect, it } from "vitest";
import { buildNotification, cleanupDatabase, createGatewaySecretMiddleware, errorHandler, requireTestDatabaseUrl } from "@shared/utils";
import type { PrismaClient } from "./generated/prisma/index.js";

const databaseUrl = requireTestDatabaseUrl("notification_test_db");
const secret = "fitsupply_test_internal_secret";
let prisma: PrismaClient;
let close: () => Promise<void>;
let app: express.Express;
beforeAll(async () => {
  process.env.DATABASE_URL = databaseUrl;
  const database = await import("./config/db.js"); prisma = database.default; close = database.closeDb;
  const { attachNotificationUser } = await import("./middleware/user-context.middleware.js");
  app = express(); app.use(express.json(), createGatewaySecretMiddleware(secret), attachNotificationUser);
  app.use((await import("./routes/notification.route.js")).default, errorHandler);
});
const clean = () => cleanupDatabase("notification_test_db", databaseUrl, { execute: async (sql) => { await prisma.$executeRawUnsafe(sql); } });
beforeEach(clean);
afterAll(async () => { if (prisma) { try { await clean(); } finally { await close(); } } });

it("existing internal intake requires secret and persisted notifications stay owner scoped", async () => {
  const body = buildNotification({ userId: "owner" });
  await request(app).post("/internal/notifications").send(body).expect(403);
  await request(app).post("/internal/notifications").set("x-internal-secret", secret).send(body).expect(201);
  await request(app).get("/notifications/me").set("x-internal-secret", secret).expect(401);
  const foreign = await request(app).get("/notifications/me").set("x-internal-secret", secret).set("x-user-id", "foreign").expect(200);
  expect(foreign.body.items).toHaveLength(0);
  expect(await prisma.notification.count()).toBe(1);
});
it("bulk read and repeated single read never change another user's unread records", async () => {
  const own = await prisma.notification.create({ data: buildNotification({ userId: "owner" }) });
  const foreign = await prisma.notification.create({ data: buildNotification({ userId: "foreign" }) });
  await request(app).patch(`/notifications/${own.id}/read`).set("x-internal-secret", secret).set("x-user-id", "foreign").expect(403);
  expect((await prisma.notification.findUniqueOrThrow({ where: { id: own.id } })).isRead).toBe(false);
  for (let replay = 0; replay < 2; replay++) await request(app).patch("/notifications/read-all").set("x-internal-secret", secret).set("x-user-id", "owner").expect(200);
  await request(app).patch(`/notifications/${own.id}/read`).set("x-internal-secret", secret).set("x-user-id", "owner").expect(200);
  expect((await prisma.notification.findUniqueOrThrow({ where: { id: own.id } })).isRead).toBe(true);
  expect((await prisma.notification.findUniqueOrThrow({ where: { id: foreign.id } })).isRead).toBe(false);
});
