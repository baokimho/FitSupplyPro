import express from "express";
import request from "supertest";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { buildNotification, cleanupDatabase, createGatewaySecretMiddleware, errorHandler, requireTestDatabaseUrl,
  createIntegrationEvent, createLogger, processInboxEvent, openRabbitMq, readRabbitMqConfig, declareRabbitMqTopology,
  serializeIntegrationEvent, DOMAIN_EXCHANGE, startInboxMessaging, ServiceUnavailableError, getCorrelation,
  traced, SpanKind, telemetryMetrics, runWithCorrelation, activeTraceFields, traceHeaders, telemetryContext, ROOT_CONTEXT, type KnownIntegrationEvent } from "@shared/utils";
import type { PrismaClient } from "./generated/prisma/index.js";
import { acceptNotificationEvent } from "./services/notification-consumer.js";
import { claimEmailDelivery, deliverEmailOnce, sendClaimedEmail, startEmailWorker } from "./services/delivery-worker.js";
import { FakeEmailProvider, type EmailProvider } from "./providers/email-provider.js";
import { defaultEmailPolicy, deliveryIdentity, EmailProviderError, notificationEventTypes } from "./domain/notification.js";
import { registerNotificationMetrics } from "./metrics.js";

const databaseUrl = requireTestDatabaseUrl("notification_test_db");
const secret = "fitsupply_test_internal_secret";
let prisma: PrismaClient;
let close: () => Promise<void>;
let app: express.Express;
const logs: string[] = [];
const logger = createLogger({ service: "notification-service", environment: "test", level: "debug" }, { write: (line: string) => { logs.push(line); } });
const event = () => createIntegrationEvent({ eventType: "order.confirmed", correlationId: randomUUID(), causationId: null,
  data: { orderId: randomUUID(), userId: "owner" } });
beforeAll(async () => {
  process.env.DATABASE_URL = databaseUrl;
  const database = await import("./config/db.js"); prisma = database.default; close = database.closeDb;
  const { attachNotificationUser } = await import("./middleware/user-context.middleware.js");
  app = express(); app.use(express.json(), createGatewaySecretMiddleware(secret), attachNotificationUser);
  app.use((await import("./routes/notification.route.js")).default, errorHandler);
});
const clean = () => cleanupDatabase("notification_test_db", databaseUrl, { execute: async (sql) => { await prisma.$executeRawUnsafe(sql); } });
beforeEach(async () => { await clean(); logs.length = 0; });
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

it("commits Inbox, Notification and one EMAIL delivery atomically", async () => {
  const source = event();
  await acceptNotificationEvent(prisma, source, logger);
  expect(await prisma.checkoutEvent.count()).toBe(1);
  expect(await prisma.notification.findUniqueOrThrow({ where: { sourceEventId: source.eventId } })).toMatchObject({ userId: "owner", correlationId: source.correlationId });
  expect(await prisma.notificationDelivery.findFirstOrThrow()).toMatchObject({ channel: "EMAIL", status: "PENDING", attemptCount: 0 });
});

it("concurrent duplicate acceptance creates one notification/delivery and rejects changed content", async () => {
  const source = event();
  await Promise.all(Array.from({ length: 6 }, () => acceptNotificationEvent(prisma, source, logger)));
  expect(await prisma.checkoutEvent.count()).toBe(1);
  expect(await prisma.notification.count()).toBe(1);
  expect(await prisma.notificationDelivery.count()).toBe(1);
  await expect(acceptNotificationEvent(prisma, { ...source, data: { ...source.data, userId: "different" } }, logger)).rejects.toThrow("Event ID reused with different content");
  expect(await prisma.notificationDelivery.count()).toBe(1);
});

it("failed acceptance transaction rolls back all effects and allows later acceptance", async () => {
  const source = event();
  await expect(prisma.$transaction((tx) => processInboxEvent(tx, source, async () => {
    await tx.notification.create({ data: { userId: "owner", type: "ORDER_CONFIRMED", title: "Order", message: "Confirmed",
      sourceEventId: source.eventId, deliveries: { create: {} } } });
    throw new Error("rollback after both effects");
  }))).rejects.toThrow("rollback after both effects");
  expect(await prisma.checkoutEvent.count()).toBe(0);
  expect(await prisma.notification.count()).toBe(0);
  expect(await prisma.notificationDelivery.count()).toBe(0);
  await acceptNotificationEvent(prisma, source, logger);
  expect(await prisma.checkoutEvent.count()).toBe(1);
});

it("two workers claim one row once; successful delivery has stable durable provider receipt", async () => {
  await acceptNotificationEvent(prisma, event(), logger);
  const claims = await Promise.all([claimEmailDelivery(prisma), claimEmailDelivery(prisma)]);
  expect(claims.filter(Boolean)).toHaveLength(1);
  const claim = claims.find((row) => row !== null)!;
  const provider = new FakeEmailProvider(prisma);
  await Promise.all([sendClaimedEmail(prisma, claim, provider, logger), sendClaimedEmail(prisma, claim, provider, logger)]);
  expect(await prisma.notificationDelivery.findUniqueOrThrow({ where: { id: claim.id } })).toMatchObject({ status: "SENT", attemptCount: 1 });
  expect(await prisma.fakeEmailReceipt.findUniqueOrThrow({ where: { deliveryKey: deliveryIdentity(claim.id) } })).toMatchObject({ messageId: expect.any(String) });
  expect(await deliverEmailOnce(prisma, provider, logger)).toBe(false);
});

it("provider failure retries in DB independently of committed Inbox then exhausts without secret text", async () => {
  await acceptNotificationEvent(prisma, event(), logger);
  const send = vi.fn<EmailProvider["send"]>().mockRejectedValue(new Error("Bearer SECRET provider=password email body"));
  for (let attempt = 1; attempt <= 3; attempt++) {
    expect(await deliverEmailOnce(prisma, { send }, logger)).toBe(true);
    const row = await prisma.notificationDelivery.findFirstOrThrow();
    expect(row).toMatchObject({ status: attempt === 3 ? "FAILED" : "PENDING", attemptCount: attempt, lastError: "EMAIL_UNKNOWN" });
    if (attempt < 3) {
      expect(row.nextAttemptAt.getTime()).toBeGreaterThan(Date.now());
      expect(await deliverEmailOnce(prisma, { send }, logger)).toBe(false);
      await prisma.notificationDelivery.update({ where: { id: row.id }, data: { nextAttemptAt: new Date(0) } });
    }
  }
  expect(send).toHaveBeenCalledTimes(3);
  expect(new Set(send.mock.calls.map(([message]) => message.deliveryKey)).size).toBe(1);
  expect(await prisma.checkoutEvent.count()).toBe(1);
  expect(await deliverEmailOnce(prisma, { send }, logger)).toBe(false);
  expect(logs.join("")).not.toContain("SECRET");
  expect(logs.join("")).not.toContain("email body");
});

it("transient failure followed by success retains attempt identity", async () => {
  await acceptNotificationEvent(prisma, event(), logger);
  const send = vi.fn<EmailProvider["send"]>().mockRejectedValueOnce(new EmailProviderError("TRANSIENT")).mockResolvedValue({ messageId: "accepted" });
  await deliverEmailOnce(prisma, { send }, logger);
  const row = await prisma.notificationDelivery.findFirstOrThrow();
  await prisma.notificationDelivery.update({ where: { id: row.id }, data: { nextAttemptAt: new Date(0) } });
  await deliverEmailOnce(prisma, { send }, logger);
  expect(await prisma.notificationDelivery.findFirstOrThrow()).toMatchObject({ status: "SENT", attemptCount: 2, lastError: null, providerMessageId: "accepted", sentAt: expect.any(Date) });
  expect(send.mock.calls[0][0]).toEqual(send.mock.calls[1][0]);
});

it("permanent provider rejection stops immediately", async () => {
  await acceptNotificationEvent(prisma, event(), logger);
  await deliverEmailOnce(prisma, { send: async () => { throw new EmailProviderError("PERMANENT"); } }, logger);
  expect(await prisma.notificationDelivery.findFirstOrThrow()).toMatchObject({ status: "FAILED", attemptCount: 1, lastError: "EMAIL_PERMANENT" });
});

it("provider timeout aborts and schedules bounded retry", async () => {
  await acceptNotificationEvent(prisma, event(), logger);
  let signal: AbortSignal | undefined;
  await deliverEmailOnce(prisma, { send: async (_message, value) => { signal = value; return new Promise(() => {}); } }, logger, { ...defaultEmailPolicy, timeoutMs: 30 });
  expect(signal?.aborted).toBe(true);
  expect(await prisma.notificationDelivery.findFirstOrThrow()).toMatchObject({ status: "PENDING", lastError: "EMAIL_TIMEOUT", attemptCount: 1 });
});

it("expired claims recover with budget and fence old token; exhausted stale claim fails", async () => {
  await acceptNotificationEvent(prisma, event(), logger);
  const claim = (await claimEmailDelivery(prisma))!;
  await prisma.notificationDelivery.update({ where: { id: claim.id }, data: { claimExpiresAt: new Date(0) } });
  expect(await claimEmailDelivery(prisma)).toBeNull();
  expect(await prisma.notificationDelivery.findFirstOrThrow()).toMatchObject({ status: "PENDING", attemptCount: 1, claimToken: null, lastError: "EMAIL_CLAIM_EXPIRED" });
  await prisma.notificationDelivery.update({ where: { id: claim.id }, data: { nextAttemptAt: new Date(0) } });
  const replacement = (await claimEmailDelivery(prisma))!;
  const provider = new FakeEmailProvider(prisma);
  expect(await sendClaimedEmail(prisma, claim, provider, logger)).toBe(false);
  expect(await prisma.fakeEmailReceipt.count()).toBe(0);
  await prisma.notificationDelivery.update({ where: { id: claim.id }, data: { attemptCount: 3, claimExpiresAt: new Date(0) } });
  await claimEmailDelivery(prisma);
  expect(await sendClaimedEmail(prisma, replacement, provider, logger)).toBe(false);
  expect(await prisma.notificationDelivery.findFirstOrThrow()).toMatchObject({ status: "FAILED", attemptCount: 3 });
});

it("recovery cannot reclaim an expired but actively locked provider send", async () => {
  await acceptNotificationEvent(prisma, event(), logger);
  const claim = (await claimEmailDelivery(prisma))!;
  await prisma.notificationDelivery.update({ where: { id: claim.id }, data: { claimExpiresAt: new Date(0) } });
  let entered!: () => void;
  let release!: () => void;
  const started = new Promise<void>((resolve) => { entered = resolve; });
  const barrier = new Promise<void>((resolve) => { release = resolve; });
  const sending = sendClaimedEmail(prisma, claim, { send: async () => { entered(); await barrier; return { messageId: "active" }; } }, logger);
  try {
    await started;
    expect(await claimEmailDelivery(prisma)).toBeNull();
    expect(await prisma.notificationDelivery.findFirstOrThrow()).toMatchObject({ status: "SENDING", attemptCount: 1, claimToken: claim.claimToken });
  } finally { release(); await sending; }
  expect(await prisma.notificationDelivery.findFirstOrThrow()).toMatchObject({ status: "SENT" });
});

it("crash window after fake provider acceptance reuses durable receipt after completion rollback", async () => {
  await acceptNotificationEvent(prisma, event(), logger);
  const claim = (await claimEmailDelivery(prisma))!;
  await prisma.$executeRawUnsafe(`CREATE FUNCTION fail_email_completion() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'test completion failure'; END $$`);
  try {
    await prisma.$executeRawUnsafe(`CREATE TRIGGER fail_email_completion BEFORE UPDATE ON "NotificationDelivery" FOR EACH ROW WHEN (NEW."status" = 'SENT') EXECUTE FUNCTION fail_email_completion()`);
    await expect(sendClaimedEmail(prisma, claim, new FakeEmailProvider(prisma), logger)).rejects.toThrow();
    expect(await prisma.notificationDelivery.findFirstOrThrow()).toMatchObject({ status: "SENDING", attemptCount: 1 });
    expect(await prisma.fakeEmailReceipt.count()).toBe(1);
  } finally {
    await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS fail_email_completion ON "NotificationDelivery"`);
    await prisma.$executeRawUnsafe(`DROP FUNCTION fail_email_completion()`);
  }
  const receipt = await prisma.fakeEmailReceipt.findFirstOrThrow();
  await prisma.notificationDelivery.update({ where: { id: claim.id }, data: { claimExpiresAt: new Date(0) } });
  await claimEmailDelivery(prisma);
  await prisma.notificationDelivery.update({ where: { id: claim.id }, data: { nextAttemptAt: new Date(0) } });
  await deliverEmailOnce(prisma, new FakeEmailProvider(prisma), logger);
  expect(await prisma.notificationDelivery.findFirstOrThrow()).toMatchObject({ status: "SENT", attemptCount: 2, providerMessageId: receipt.messageId });
  expect(await prisma.fakeEmailReceipt.count()).toBe(1);
});

it("fake provider persists identity across instances and rejects changed message", async () => {
  const message = { deliveryKey: "delivery:test", recipientUserId: "owner", subject: "Subject", text: "Text" };
  const first = await new FakeEmailProvider(prisma).send(message, new AbortController().signal);
  expect(await new FakeEmailProvider(prisma).send(message, new AbortController().signal)).toEqual(first);
  await expect(new FakeEmailProvider(prisma).send({ ...message, text: "Changed" }, new AbortController().signal)).rejects.toMatchObject({ code: "PERMANENT" });
  const controller = new AbortController(); controller.abort();
  await expect(new FakeEmailProvider(prisma).send(message, controller.signal)).rejects.toThrow();
  expect(await prisma.fakeEmailReceipt.count()).toBe(1);
});

it("worker stop drains accepted send and does not claim next row", async () => {
  await acceptNotificationEvent(prisma, event(), logger);
  await acceptNotificationEvent(prisma, event(), logger);
  let entered!: () => void; let release!: () => void;
  const started = new Promise<void>((resolve) => { entered = resolve; });
  const barrier = new Promise<void>((resolve) => { release = resolve; });
  const worker = startEmailWorker(prisma, { send: async () => { entered(); await barrier; return { messageId: "drained" }; } }, logger);
  try { await started; worker.stop(); } finally { release(); await worker.close(); }
  expect(await prisma.notificationDelivery.count({ where: { status: "SENT" } })).toBe(1);
  expect(await prisma.notificationDelivery.count({ where: { status: "PENDING", attemptCount: 0 } })).toBe(1);
});

it("persisted metrics include delayed backlog, terminal states and retries without identity labels", async () => {
  registerNotificationMetrics(prisma);
  await acceptNotificationEvent(prisma, event(), logger);
  await deliverEmailOnce(prisma, { send: async () => { throw new Error("secret"); } }, logger);
  const row = await prisma.notificationDelivery.findFirstOrThrow();
  await prisma.notificationDelivery.update({ where: { id: row.id }, data: { createdAt: new Date(Date.now() - 60000), nextAttemptAt: new Date(Date.now() + 60000), attemptCount: 2 } });
  const metrics = await telemetryMetrics();
  expect(metrics).toMatch(/notifications_created_total\{[^\n]*\} 1/);
  expect(metrics).toMatch(/notification_delivery_pending\{[^\n]*\} 1/);
  expect(metrics).toMatch(/notification_delivery_retries_total\{[^\n]*\} 1/);
  expect(metrics).toMatch(/notification_delivery_oldest_pending_age_seconds\{[^\n]*\} (?:[6-9]\d|\d{3,})(?:\.\d+)?/);
  expect(metrics).not.toContain(row.id);
  expect(metrics).not.toContain("secret");
});

it("real broker acceptance preserves trace, ACKs before email and deduplicates replays", async () => {
  await withBroker(async ({ publisher, session }) => {
    const source = event();
    let parent: string | undefined;
    await traced("notification test producer", SpanKind.INTERNAL, {}, async () => {
      parent = traceHeaders().traceparent;
      await runWithCorrelation({ requestId: randomUUID(), traceId: source.correlationId }, () =>
        publisher.publish(DOMAIN_EXCHANGE, source.eventType, serializeIntegrationEvent(source)));
    });
    await vi.waitFor(async () => { expect(await prisma.checkoutEvent.count()).toBe(1); }, { timeout: 5000, interval: 20 });
    for (let i = 0; i < 3; i++) await publisher.publish(DOMAIN_EXCHANGE, source.eventType, serializeIntegrationEvent(source));
    await vi.waitFor(() => {
      expect(logs.filter((line) => line.includes(source.eventId) && line.includes("safe to acknowledge"))).toHaveLength(4);
    }, { timeout: 5000, interval: 20 });
    await session.close();
    const notification = await prisma.notification.findFirstOrThrow();
    expect(notification.correlationId).toBe(source.correlationId);
    expect(notification.traceparent?.split("-")[1]).toBe(parent?.split("-")[1]);
    expect(await prisma.notification.count()).toBe(1);
    expect(await prisma.notificationDelivery.findFirstOrThrow()).toMatchObject({ status: "PENDING", attemptCount: 0 });
    expect(await prisma.fakeEmailReceipt.count()).toBe(0);
    let fields: ReturnType<typeof activeTraceFields> = {};
    await telemetryContext.with(ROOT_CONTEXT, () => deliverEmailOnce(prisma, { send: async () => {
      fields = activeTraceFields(); expect(getCorrelation()?.traceId).toBe(source.correlationId); return { messageId: "linked" };
    } }, logger));
    expect(fields.otelTraceId).toMatch(/^[0-9a-f]{32}$/);
    expect(fields.otelTraceId).not.toBe(parent?.split("-")[1]);
  });
});

it("poison broker event quarantines without Inbox or email effects", async () => {
  await withBroker(async ({ publisher, channel }) => {
    await publisher.publish(DOMAIN_EXCHANGE, "order.confirmed", Buffer.from('{"secret":"private"}'));
    await vi.waitFor(async () => { expect((await channel.checkQueue("notification.order-events.dlq")).messageCount).toBe(1); }, { timeout: 5000, interval: 20 });
    expect(await prisma.checkoutEvent.count()).toBe(0);
    expect(await prisma.notificationDelivery.count()).toBe(0);
    expect(logs.join("")).not.toContain("private");
  });
});

it("Notification broker failures exhaust durable acceptance budget; duplicate quarantine cannot reset it", async () => {
  const handler = vi.fn(async () => { throw new ServiceUnavailableError("test DB unavailable"); });
  await withBroker(async ({ publisher, channel }) => {
    const source = event();
    for (let delivery = 1; delivery <= 2; delivery++) {
      await publisher.publish(DOMAIN_EXCHANGE, source.eventType, serializeIntegrationEvent(source));
      await vi.waitFor(async () => { expect((await channel.checkQueue("notification.order-events.dlq")).messageCount).toBe(delivery); }, { timeout: 5000, interval: 20 });
    }
    const operational = await prisma.consumerDelivery.findFirstOrThrow();
    expect(operational.attempts).toBe(3);
    expect(handler).toHaveBeenCalledTimes(3);
    expect(await prisma.checkoutEvent.count()).toBe(0);
    expect(await prisma.notification.count()).toBe(0);
  }, handler);
});

async function withBroker(work: (resources: {
  publisher: Awaited<ReturnType<Awaited<ReturnType<typeof openRabbitMq>>["createPublisher"]>>;
  channel: Awaited<ReturnType<Awaited<ReturnType<typeof openRabbitMq>>["createChannel"]>>;
  session: Awaited<ReturnType<typeof startInboxMessaging>>;
}) => Promise<void>, handler: (source: KnownIntegrationEvent) => Promise<void> = (source) => acceptNotificationEvent(prisma, source, logger)) {
  const config = readRabbitMqConfig(); const url = new URL(config.url);
  if (url.hostname !== "localhost" || url.port !== "5673" || url.username !== "fitsupply_test" || url.pathname) throw new Error("Notification tests require disposable localhost:5673");
  const broker = await openRabbitMq(config, logger);
  const channel = await broker.createChannel();
  let session: Awaited<ReturnType<typeof startInboxMessaging>> | undefined;
  try {
    await declareRabbitMqTopology(channel);
    await channel.purgeQueue("notification.order-events"); await channel.purgeQueue("notification.order-events.dlq");
    session = await startInboxMessaging(config, logger, "notification.order-events", notificationEventTypes,
      handler, prisma);
    await work({ publisher: await broker.createPublisher(), channel, session });
  } finally {
    await session?.close();
    await channel.purgeQueue("notification.order-events"); await channel.purgeQueue("notification.order-events.dlq");
    await broker.close();
  }
}
