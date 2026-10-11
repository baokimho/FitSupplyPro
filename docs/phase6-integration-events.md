# Phase 6: Integration event contracts

This page records Phase 6's contract-only scope. Phase 7's first business mappings
and current consumer wiring are documented in [Event-driven checkout](phase7-event-driven-checkout.md),
including eventual Inventory compensation after committed async Order cancellation.

Phase 6 defines public facts exchanged between services. It adds no producers,
business consumers, async checkout, Saga, Outbox, command bus or event sourcing.
Order, Inventory, Payment and notifications retain existing HTTP workflows.
The shared package depends on no business service or generated Prisma model.

## Envelope and creation

```ts
{
  eventId: "a15a8f63-7c83-46db-a1f7-6a278ee7b862",
  eventType: "payment.succeeded",
  eventVersion: 1,
  occurredAt: "2026-10-11T09:00:00.000Z",
  correlationId: "b781ca5c-9a53-4986-b8b9-23a36a0482be",
  causationId: "f923c65d-0464-4708-93de-ea6f0db8469c",
  producer: { service: "payment-service" },
  data: {
    orderId: "8403cbf2-0627-4dcf-a1f9-91c994215e5d",
    paymentId: "eb049f4c-21b8-49f6-a908-85dfd46a8c79",
    amount: "19.98",
    currency: "USD"
  }
}
```

`integrationEventEnvelopeSchema` validates structural metadata. Known contracts
also validate exact name, version, producer ownership and payload. UUID validation
reuses HTTP's `validCorrelationId`: RFC variant, versions 1–8, no nil/max UUID.
Dates must be valid ISO-8601 UTC timestamps ending in `Z`; no offsets/local times.
Versions are positive integers, not service API versions. No string/number/date
coercion occurs. `causationId` must be explicitly present, including when null.

`createIntegrationEvent` generates a fresh UUID and UTC occurrence time, selects
the registered producer and version, and validates the result. Its input is a
discriminated union of event name and payload, plus correlation/cause metadata.
Call once per new business fact. Retransmission of the same event must reuse its
ID, timestamp and full envelope; a new ID defeats consumer deduplication.

```ts
import {
  createIntegrationEvent, serializeIntegrationEvent, deserializeIntegrationEvent,
} from "@shared/utils";

const event = createIntegrationEvent({
  eventType: "payment.succeeded",
  correlationId: upstream.correlationId,
  causationId: upstream.eventId,
  data: { orderId, paymentId, amount: "19.98", currency: "USD" },
});
const bytes = serializeIntegrationEvent(event); // UTF-8 JSON Buffer, validated
const received = deserializeIntegrationEvent(bytes); // KnownIntegrationEvent
if (received.eventType === "payment.succeeded") {
  received.data.paymentId; // string, narrowed by eventType
}
```

Producer metadata identifies semantic ownership, not authenticated provenance.
Broker credentials/permissions must establish trust separately. Delivery tags,
exchange/queue names, retry counters and AMQP headers do not belong in this envelope.

## Identifier semantics and context

| Identifier | Actual purpose |
| --- | --- |
| `eventId` | One emitted fact; stable across retransmissions, unique across new facts |
| `correlationId` | Whole distributed workflow; HTTP root uses existing `traceId` |
| `causationId` | UUID of immediately preceding message/event/command; null at HTTP roots |
| `requestId` | One HTTP hop; outgoing `correlationHeaders` generates a new UUID |
| `traceId` | Gateway-owned trace UUID preserved by internal HTTP hops |
| `idempotencyKey` | Client/business command deduplication within existing user/action scopes |
| `operationId` | Inventory mutation deduplication; current values include composite action/product IDs |

HTTP-root creation may omit `correlationId`: the factory reads AsyncLocalStorage's
`getCorrelation().traceId`. It does not use `requestId` as either cause or workflow
identity. HTTP-root calls explicitly pass `causationId: null`. Outside HTTP context,
creation must supply correlation explicitly; missing context fails validation.
Do not generate an unrelated trace per event to hide absent workflow context.

An event reaction explicitly supplies upstream `correlationId` unchanged and
`causationId: upstream.eventId`. A future command reaction uses that command's UUID.
Request IDs, client idempotency keys and Inventory composite operation IDs are not
event causation IDs. These conventions create no command messaging in Phase 6.

For example, an HTTP trace C1 produces Order event E1 with cause null; Inventory
fact E2 has correlation C1 and cause E1; Payment fact E3 has correlation C1 and
cause E2. All event IDs differ.

Phase 5's generic broker publisher/consumer still propagates context through AMQP
`x-request-id`/`x-trace-id` headers. Phase 7 must validate an event before business
work, establish `runWithCorrelation({ requestId: freshUuid, traceId: event.correlationId }, work)`
and preserve explicit upstream cause when emitting. Validated envelope correlation
is authoritative for event workflows; headers must not silently replace it. No
business adapter or header/envelope reconciliation is wired into current consumers.

## Naming and ownership

Names use `<domain>.<past_tense_fact>` in lowercase; underscores separate words.
Names are stable machine identifiers. Syntax alone cannot establish past tense;
the finite registry is the semantic allowlist. `inventory.reserve` means
“Please reserve” (command); `inventory.reserved` means “Reservation happened”
(event). Commands are not registered as integration events.

Every contract below currently supports **version 1 only**. The producing service
owns its meaning; schemas live in `packages/shared/src/events`.

| Contract | Owner | Required payload and meaning |
| --- | --- | --- |
| `inventory.reserved` | Inventory | `orderId`, `reservations[]`; all listed reservations completed |
| `inventory.reservation_failed` | Inventory | `orderId`, `productId`, requested `quantity`, `reason`; reservation rejected for `INSUFFICIENT_STOCK` or `PRODUCT_NOT_FOUND` |
| `inventory.released` | Inventory | `orderId`, `reservations[]`; listed held quantities released |
| `inventory.consumed` | Inventory | `orderId`, `reservations[]`; listed held quantities consumed/deducted |
| `payment.succeeded` | Payment | `orderId`, `paymentId`, `amount`, `currency`; provider settlement succeeded |
| `payment.failed` | Payment | Payment fields above plus required nullable `failureCode`; settlement failed, null when no safe code exists |
| `payment.refunded` | Payment | Payment fields above; full refund completed, amount is refunded amount |
| `order.created` | Order | `orderId`, `userId`, `items[]`, `totalAmount`, `currency`; accepted order and immutable item quantities |
| `order.confirmed` | Order | `orderId`, `userId`; confirmation transition completed |
| `order.cancelled` | Order | `orderId`, `userId`, `items[]`; cancellation completed with original item quantities |
| `order.processing_started` | Order | `orderId`, `userId`; processing transition completed after reservation consumption |

Each item/reservation contains only `productId` and `quantity`. Lists are nonempty
and aggregated to one entry per product. Quantities are integers from 1 through
2,147,483,647, matching current PostgreSQL/Order limits. Order, Payment and Catalog
generate UUID business IDs; these contracts validate UUID `orderId`, `paymentId`
and `productId`. `userId` is a nonblank string because existing trusted identities
include non-UUID IDs. No identifiers are trimmed or transformed.

Money is a canonical nonnegative decimal **string**, exactly two fractional digits,
from `0.00` through `99999999.99`, matching current Decimal(10,2). Zero-priced orders
remain valid. Currency is `USD`, matching Order's authoritative payment snapshot;
no unsupported multi-currency behavior is promised. Failure codes are bounded
uppercase machine codes, not exception messages or provider secrets.

These facts match existing reservation/release/consume, payment/refund and Order
states. Shipment/delivery events remain deferred: they are outside upcoming checkout
foundation. No Prisma IDs for Inventory rows, provider receipts, progress states,
addresses, prices per item or whole database models are published.

Inventory currently has per-product HTTP mutations, not an atomic order reservation
aggregate. A future mapping must publish `inventory.reserved` only after **every**
listed reservation succeeds, and not publish whole-order success after one product.
Failure does not assert that earlier partial reservations have been compensated.
Release/consume facts describe only completed listed quantities. Order cancellation
currently follows successful release; its event is a completed fact, not a request
to release stock again. Future orchestration must preserve these meanings.
Payment success describes settlement, not an assertion that Order confirmation
already succeeded. Consumers needing fresh authoritative state use service-owned
interfaces; payloads do not replace those interfaces or define async orchestration.

## Registry and version compatibility

`integrationEventRegistry` is a readonly tuple of complete Zod event schemas. Each
schema declares name, literal version, literal producer and payload together.
`knownIntegrationEventSchema` derives a discriminated union. `EventType`,
`IntegrationEventFor<T>`, `PayloadFor<T>` and `KnownIntegrationEvent` derive from
that union; no separate manual TypeScript payload map exists. Tests check unique
names and complete valid fixtures. Zod also rejects duplicate discriminator names.

Unknown additive fields are ignored/removed at envelope, producer, payload and
item levels using Zod object semantics. Readers can therefore accept new optional
fields without a version bump. Serialization emits the validated projection,
not all fields of arbitrary source models. This is deliberate field projection,
not coercion of invalid known fields. Readers never substitute missing required
business data or default malformed values.

Adding an optional field is compatible only when old readers can ignore it and
new readers accept its absence. A nullable addition is compatible only when also
optional or explicitly defaulted safely by its future schema; nullable-but-required
alone breaks old messages. Renames, deletion, meaning/type changes, requiredness
changes, new mandatory constraints or changed fact timing require a new version.
Changing currency/payment semantics also requires compatibility review.

Future breaking versions must retain V1 decoding while V1 producers/messages remain,
add explicit schemas and fixtures for the new version, and dispatch on both name
and version (nested discriminators where needed). Current parser explicitly rejects
every unregistered version; changing a service API or exchange name cannot opt in.
Deploy compatible readers before writers; retire old versions only after producers,
queues, DLQs and retained/replayed messages no longer require them.

## Boundary and error policy

`parseIntegrationEvent(unknown)` throws `IntegrationEventError` on contract failure.
`safeParseIntegrationEvent(unknown)` returns `{ success: true, data }` or
`{ success: false, error }`. These parse **decoded objects**, not JSON strings.
`serializeIntegrationEvent(KnownIntegrationEvent)` validates then returns UTF-8
JSON bytes. `deserializeIntegrationEvent(string | Uint8Array)` accepts JSON text,
Buffer or byte array, validates encoding/JSON, then applies the same parser. UTF-8
decoding is fatal, never replacement-based; BOM-prefixed JSON is rejected.

Classification order is deterministic:

| Error code | Meaning |
| --- | --- |
| `INVALID_UTF8` | Byte sequence is not valid UTF-8 |
| `MALFORMED_JSON` | JSON syntax invalid |
| `INVALID_ENVELOPE` | Missing/invalid metadata, non-object data, or wrong producer for known contract |
| `UNKNOWN_EVENT_TYPE` | Structurally valid name absent from registry, including command names |
| `UNSUPPORTED_EVENT_VERSION` | Known name with positive but unregistered version |
| `INVALID_PAYLOAD` | Known version/producer with missing or invalid business fields |

Structural envelope validation precedes name/version dispatch; name precedes
version; producer ownership precedes payload. Errors expose `code` plus Zod
`issues` where relevant. Error text does not contain raw messages. These are
non-HTTP contract errors, distinct from shared HTTP response errors.

Later consumers can reject/dead-letter malformed contract messages without requeue
loops. Unknown types/versions indicate deployment/schema mismatch and need an
operator decision before replay. Do not ACK and silently discard violations or
classify them as transient business outages. Phase 6 makes no automatic ack/nack,
retry, replay or DLQ policy change; Phase 5 mechanics remain intact.

## Domain, integration and RabbitMQ boundaries

An internal domain operation/result belongs to its service. The owning service
explicitly maps that result into a validated public integration fact, then uses
transport to deliver serialized bytes. No internal domain-event abstraction,
event-sourced model or direct Prisma-to-broker publication is introduced.

`eventType` is contract vocabulary; RabbitMQ routing key is transport vocabulary.
They may share a string but have separate ownership. Current Phase 5 keys/bindings
remain unchanged, and some new contracts have no broker binding yet. Registering a
schema neither enables routing nor starts a consumer. Phase 7 must deliberately
add required bindings and orchestration. Outbox/durable event publication remains
deferred; contract validation does not guarantee atomic DB commit plus publish.

## Verification

Three test files under `packages/shared/src/events` cover envelope rules, every
payload, additive compatibility, registry uniqueness, discriminator typing,
serialization round trips, metadata creation/propagation, validation on output,
malformed UTF-8/JSON and deterministic error classification.

Type assertions are also checked explicitly because shared production tsconfig
does not include test files:

```sh
npm exec -- tsc --noEmit --strict --skipLibCheck --module NodeNext --target ES2020 packages/shared/src/events/contracts.test.ts packages/shared/src/events/boundary.test.ts packages/shared/src/events/envelope.test.ts
```

Full verification results are recorded in [TESTING.md](../TESTING.md).
