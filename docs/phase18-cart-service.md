# Phase 18 — Cart Service

## Audit and scope

Cart already owned one cart per trusted user, one row per product, advisory
Catalog snapshots and internal versioned checkout cleanup. Existing Gateway
JWT/header sanitization and service internal-secret middleware enforced trust;
foreign items were deliberately indistinguishable from absent items (404).
Order already reloaded Catalog metadata/prices, reserved through Inventory and
owned checkout idempotency and immutable purchase snapshots. Those boundaries
remain unchanged. Existing tests covered two finalization cases, downstream
error envelopes and Gateway ownership E2E.

Concrete gaps: first-cart/item creation races; read-modify-write lost increments;
ownership/version checks outside deletion transactions; split version/items
reads; no DB quantity/price checks; boolean/array quantity coercions and overflow;
non-recoverable checkout deletion after lost HTTP response; raw Catalog error
logging/transport details; absent read retries and UUID dependency correlation;
no dependency readiness endpoint; npm/watch wrapper between Docker signals and
the service process.

## Architecture and invariants

```text
Gateway verified identity + internal secret
                 |
             Cart API
          /              \
 Catalog GET          PostgreSQL
 (bounded safe       per-user transaction lock
  read retries)      Cart + CartItem + checkout-removal receipt
                 |
          Order checkout
       reloads Catalog prices
       commands Inventory
       persists Order snapshot
```

All Cart reads/mutations use transaction-scoped PostgreSQL advisory lock
`cart.user:<userId>`, including an absent cart. Lock covers local state only;
Catalog HTTP runs before the transaction. Thus first creation, adds, absolute
updates, removals, clear and checkout cleanup share one serialization boundary.
Reads return version and items from the same protected transaction. PostgreSQL
unique user and `(cartId, productId)` constraints remain the final uniqueness
boundary. Quantity/price/version checks reject invalid direct DB writes too.

Quantities are positive signed-32-bit integers. Existing numeric-string inputs
remain accepted; booleans, arrays, null, fractions, non-finite numbers and overflow
now fail validation deterministically. Service entry points validate as well as
HTTP routes. Increment overflow returns 400 without changing quantity/version.
Database checks require quantity > 0, snapshot price >= 0 and Cart version > 0.
The additive migration validates existing rows; invalid legacy data is not
silently rewritten or deleted.

## Concurrency and HTTP semantics

POST add is additive per accepted request: two `+1` operations on quantity 2
produce 4. It does not promise transport idempotency; retrying an ambiguous POST
can intentionally add again. No blanket idempotency key requirement was added.
PATCH replaces quantity absolutely; serialized last committed operation wins.
Remove versus update serializes: update first may succeed before removal;
removal first makes update return 404. Missing or foreign item removal remains
404. Clear is safe on empty/absent carts. Existing mutation HTTP statuses remain.
Successful mutations increment version once and advance the Cart timestamp.

Internal checkout deletion validates cart identity, selected IDs and version
inside the same transaction as deletion/version increment. A competing add
either commits before cleanup (409 stale snapshot, no deletion) or afterward
(new intent survives). No distributed Cart/Order transaction was introduced.

For requests containing both existing cartId and cartVersion, a durable
`CartCheckoutRemoval` receipt stores the sorted, deduplicated item-ID fingerprint
under `(cartId, cartVersion)`. This fixes a concrete lost-response window after
deletion committed but before Order received success. Exact retry returns current
Cart without deleting or incrementing again, even after new items were added.
Changed selected IDs under that identity return 409. Ownership and cart identity
are checked before receipt lookup. Unversioned legacy internal deletion retains
existing behavior. No public endpoint or new client-supplied key is required.

## Catalog, Cart and Order authority

Cart snapshots describe shopping intent, not purchase guarantees. Add fetches
current Catalog product, rejects missing/unpublished products and refreshes name,
price and image. Quantity-only updates and reads retain existing snapshots.
Deleted/unpublished products can remain in an existing cart; Order must reject
them during authoritative checkout lookup. Catalog response identity and usable
metadata/decimal price are validated before persistence. Path IDs are encoded.

Order still reloads Catalog and constructs authoritative Decimal purchase
snapshots; stale Cart price cannot set Order price. Inventory owns stock, and
Payment owns financial effects. Cart calls neither Payment, Shipping nor
Notification. Sync checkout stays default; async opt-in and Saga/Outbox/Inbox
semantics are unchanged.

## Failures, observability and lifecycle

Reuse shared `fetchDependency` deadlines/cancellation and `retryOperation` bounded
backoff/jitter for safe GETs. Mutations never retry automatically. Catalog 404 and
established nested domain 4xx errors retain their public contracts. Transport and
server failures return safe 503; raw causes/URLs/provider bodies are no longer
public details or printed response payloads. Malformed Catalog metadata produces
safe 503 before any Cart write. Existing shared validation/auth/404/409/internal
error envelopes remain intact.

HTTP/dependency metrics and spans use Phase 15 infrastructure. Catalog calls now
carry both UUID correlation headers and active W3C context. No IDs occur in metric
labels; extra business counters were not needed to fix an observed gap. Scoped
error handler uses sanitized structured logs. `/health` is liveness; `/ready`
uses bounded PostgreSQL check and stopping flag. Catalog is request-specific,
so its outage does not prevent safe reads/removals or make instance readiness
fragile. Shared shutdown guard, dependency cancellation, HTTP drain, DB/pool and
telemetry cleanup remain; Compose executes Node directly for signal delivery.

## Verification and intentionally unchanged behavior

Fast tests cover quantities, safe dependency retry budgets, mutation retry safety,
error contracts, cancellation and UUID/W3C propagation. Real PostgreSQL/API tests
cover simultaneous first adds, blocked concurrent increments (explicit DB lock
barrier), remove/update and checkout/add races, duplicate cleanup receipts,
new-intent protection, direct constraints, receipt rollback, owner isolation,
overflow, stale advisory prices and invalid Catalog data. Cleanup includes the
new receipt table and only targets guarded disposable databases.

E2E adds a realistic quantity/edit/stale-price journey: unpublish causes checkout
failure without deleting intent; republish plus fresh checkout key purchases at
current Catalog price, then clears selected items. Existing foreign-user cart
tests, stock failure, Payment, Saga, broker recovery and Phase 17 Notification
journeys remain. Commands/results are in `TESTING.md`.

Shuffle seed 18018 exposed a pre-existing Gateway fixture coupling: its real
SIGTERM test permanently aborts process dependency work, preventing later cold
JWKS fetches. The unchanged shutdown guarantees now run in an isolated test file;
security assertions and production behavior were not weakened.

The broader concurrent budget test also exposed an ORM initial-ledger upsert
race: competing first deliveries could fail uniqueness instead of admitting the
configured attempt count. Shared claim now uses native PostgreSQL
`INSERT ... ON CONFLICT ... DO UPDATE ... WHERE attempts < budget RETURNING`.
Receipt bypass, replay identity and budgets stay unchanged. The regression now
requires rejected concurrent claims to carry `DELIVERY_BUDGET_EXHAUSTED`.

No variant model, stock reservation inside Cart, distributed transaction, new
event, background worker or speculative provider was added. Snapshot read behavior,
404 owner privacy, additive POST, absolute PATCH and default checkout mode remain
intentional. Durable cleanup receipts require retention coordinated with Order
checkout retry retention; premature removal can lose old retry recognition.
