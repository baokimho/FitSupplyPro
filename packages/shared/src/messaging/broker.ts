import { connect, type Channel, type ChannelModel, type ConfirmChannel } from "amqplib";
import type { Logger } from "../logging/logger.js";
import { getCorrelation } from "../http/correlation.js";
import type { RabbitMqConfig } from "./config.js";
import { consumeRabbitMq, type RabbitMqHandler } from "./consumer.js";

const CONFIRM_TIMEOUT_MS = 3000;

/** Plain connect deliberately has no recovery loop. Caller owns restart/reconnection. */
export async function openRabbitMq(config: RabbitMqConfig, logger: Logger) {
  let connection: ChannelModel;
  try {
    connection = await connect(config.url, { timeout: config.connectionTimeoutMs });
  } catch (err) {
    logger.error({ err, operation: "broker.connect" }, "broker connection failed");
    throw err;
  }
  let connected = true;
  let blocked = false;
  let closing = false;
  let pendingClose: Promise<void> | undefined;
  const channels = new Set<Channel>();
  const consumers = new Set<() => Promise<void>>();
  const publishers = new Set<() => Promise<void>>();
  connection.on("error", (err: Error) => logger.error({ err }, "broker connection error"));
  connection.on("blocked", (reason: string) => {
    blocked = true;
    logger.warn({ reason }, "broker connection blocked");
  });
  connection.on("unblocked", () => { blocked = false; logger.info("broker connection unblocked"); });
  connection.on("close", () => {
    connected = false;
    if (!closing) logger.error("broker connection closed unexpectedly; caller must restart");
  });
  logger.info("broker connected");

  function assertOpen() {
    if (closing || !connected) throw new Error("Broker unavailable or shutting down");
  }

  async function createChannel(confirm: true): Promise<ConfirmChannel>;
  async function createChannel(confirm?: false): Promise<Channel>;
  async function createChannel(confirm = false): Promise<Channel> {
    assertOpen();
    const channel = confirm ? await connection.createConfirmChannel() : await connection.createChannel();
    channel.on("error", (err: Error) => logger.error({ err }, "broker channel error"));
    channel.on("close", () => { channels.delete(channel); });
    channels.add(channel);
    if (closing) {
      await channel.close();
      throw new Error("Broker shutting down");
    }
    return channel;
  }

  async function createPublisher() {
    const channel = await createChannel(true);
    let tail: Promise<void> = Promise.resolve();
    // ponytail: one publish in flight per publisher; use multiple publishers for higher throughput.
    function publish(exchange: string, routingKey: string, content: Buffer): Promise<void> {
      const correlation = getCorrelation();
      const result = tail.then(() => {
        assertOpen();
        if (blocked) throw new Error("Broker connection blocked");
        return new Promise<void>((resolve, reject) => {
          let returned = false;
          let confirmed = false;
          let drained = true;
          let finished = false;
          const onReturn = () => { returned = true; };
          const onClose = () => finish(new Error("Publisher channel closed before confirmation"));
          const onDrain = () => { drained = true; if (confirmed) finish(); };
          const timer = setTimeout(() => {
            finish(new Error("Publisher confirmation timed out; delivery outcome unknown"));
            void channel.close().catch((err: unknown) => logger.error({ err }, "publisher close failed"));
          }, CONFIRM_TIMEOUT_MS);
          function finish(err?: unknown) {
            if (finished) return;
            finished = true;
            clearTimeout(timer);
            channel.off("return", onReturn);
            channel.off("close", onClose);
            channel.off("drain", onDrain);
            if (err) {
              logger.error({ ...correlation, exchange, routingKey, err }, "broker publish failed");
              reject(err);
            } else {
              logger.debug({ ...correlation, exchange, routingKey }, "broker publish confirmed");
              resolve();
            }
          }
          channel.on("return", onReturn);
          channel.on("close", onClose);
          channel.on("drain", onDrain);
          try {
            drained = channel.publish(exchange, routingKey, content, {
              persistent: true,
              mandatory: true,
              headers: correlation ? { "x-request-id": correlation.requestId, "x-trace-id": correlation.traceId } : {},
            }, (err: unknown) => {
              confirmed = true;
              if (err) finish(err);
              else if (returned) finish(new Error("Broker returned unroutable message"));
              else if (drained) finish();
            });
          } catch (err) { finish(err); }
        });
      });
      tail = result.catch(() => undefined);
      return result;
    }
    publishers.add(() => tail);
    return { publish };
  }

  async function subscribe(queue: string, handler: RabbitMqHandler, prefetch = 10) {
    const channel = await createChannel();
    try {
      const consumer = await consumeRabbitMq(channel, queue, handler, logger, prefetch);
      consumers.add(consumer.stop);
      if (closing) { await consumer.stop(); throw new Error("Broker shutting down"); }
      return consumer;
    } catch (err) {
      if (channels.has(channel)) await channel.close();
      throw err;
    }
  }

  function close(): Promise<void> {
    if (pendingClose) return pendingClose;
    closing = true;
    pendingClose = (async () => {
      const stopped = await Promise.allSettled([...consumers, ...publishers].map((stop) => stop()));
      const closed = await Promise.allSettled([...channels].map((channel) => channel.close()));
      if (connected) await connection.close();
      const failure = [...stopped, ...closed].find((result) => result.status === "rejected");
      if (failure?.status === "rejected") throw failure.reason;
      logger.info("broker resources closed");
    })();
    return pendingClose;
  }

  return { createChannel: () => createChannel(), createPublisher, subscribe, close,
    isReady: () => connected && !blocked && !closing };
}
