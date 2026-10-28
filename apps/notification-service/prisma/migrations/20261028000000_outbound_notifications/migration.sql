ALTER TYPE "NotificationType" ADD VALUE 'ORDER_CONFIRMED';
ALTER TABLE "Notification" ADD COLUMN "sourceEventId" TEXT,
    ADD COLUMN "correlationId" TEXT, ADD COLUMN "traceparent" TEXT;
CREATE UNIQUE INDEX "Notification_sourceEventId_key" ON "Notification"("sourceEventId");

CREATE TABLE "CheckoutEvent" (
    "eventId" TEXT PRIMARY KEY, "eventType" TEXT,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fingerprint" TEXT NOT NULL, "result" TEXT
);
CREATE TABLE "ConsumerDelivery" (
    "consumer" TEXT NOT NULL, "messageKey" TEXT NOT NULL,
    "replayCount" INTEGER NOT NULL DEFAULT 0, "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    PRIMARY KEY ("consumer", "messageKey", "replayCount")
);
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL');
CREATE TYPE "NotificationDeliveryStatus" AS ENUM ('PENDING', 'SENDING', 'SENT', 'FAILED');
CREATE TABLE "NotificationDelivery" (
    "id" TEXT PRIMARY KEY, "notificationId" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'EMAIL',
    "status" "NotificationDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimToken" TEXT, "claimExpiresAt" TIMESTAMP(3), "providerMessageId" TEXT, "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL, "sentAt" TIMESTAMP(3),
    CONSTRAINT "NotificationDelivery_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "NotificationDelivery_notificationId_channel_key" ON "NotificationDelivery"("notificationId", "channel");
CREATE INDEX "NotificationDelivery_status_nextAttemptAt_createdAt_idx" ON "NotificationDelivery"("status", "nextAttemptAt", "createdAt");
CREATE INDEX "NotificationDelivery_status_claimExpiresAt_idx" ON "NotificationDelivery"("status", "claimExpiresAt");
CREATE TABLE "FakeEmailReceipt" (
    "deliveryKey" TEXT PRIMARY KEY, "fingerprint" TEXT NOT NULL, "messageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "FakeEmailReceipt_messageId_key" ON "FakeEmailReceipt"("messageId");
