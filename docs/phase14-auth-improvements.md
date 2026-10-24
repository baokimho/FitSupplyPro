# Phase 14 — Auth improvements

## 2026-10-24 follow-up audit

The revised P14.1–P14.20 request starts from completed hardening at `8fddc1c`,
not the earlier Phase 13-only baseline. Credential/JWT/JWKS/configuration,
refresh/logout and logging work below is preserved rather than rebuilt.

The additional authorization audit traced verified Gateway claims through secret-
protected service middleware to resource queries/mutations. Order reads/cancels,
Payment reads/creation, Shipment reads, Notification read-state mutations and
Cart item mutations already enforce ownership. Lists scope to trusted user ID.
Admin financial/lifecycle operations intentionally authorize by verified ADMIN
role; owner-only reads do not gain an implicit admin override. Internal routes
remain blocked at the public Gateway. No new runtime IDOR defect was found.

Concrete coverage gaps: actual Gateway HTTP tests lacked wrong issuer/audience,
forged-signature, unexpected-algorithm and some structural-token cases, although
shared verifier tests covered them. Existing E2E covered cross-user Order denial
but not anonymous/spoofed access to a real Order, Payment/Shipment read isolation,
Notification mutation ownership or Cart item update/delete isolation. Follow-up
changes close those proof gaps using existing endpoints and fixtures, without
changing production authorization semantics or adding services.

Follow-up ownership policy and verification:

| Existing public resource | Authorization retained | Regression evidence |
| --- | --- | --- |
| Order by ID / cancellation | Owner required; foreign owner gets 403 | Owner GET succeeds, anonymous spoofed headers get 401, foreign JWT plus spoofed owner/admin headers cannot read/cancel or alter PENDING state |
| Payment by ID / creation | Read owner and payable Order owner required; financial mutations require ADMIN | Foreign read/create/confirm denied; owner payment stays PENDING until real admin confirmation; foreign list excludes payment |
| Shipment by ID | Read owner required; public shipment mutations require ADMIN | Foreign read/update denied; owner sees unchanged PROCESSING shipment; foreign list excludes shipment |
| Notification read state | Stored user ID must match trusted requester | Foreign mark-read denied without changing unread state; owner mark-read succeeds; foreign list excludes notification |
| Cart item update/delete | Item query scoped to requester's Cart | Foreign item IDs return 404, owner quantity stays unchanged, owner update/delete succeeds, spoofed GET still returns requester's own Cart |

403 denotes an authenticated identity lacking permission. Cart intentionally
returns 404 for an item outside the caller's Cart; no generic Gateway ownership
or 405 table is introduced. Ownership is enforced by owning services after the
Gateway verifies/reconstructs identity. Possession of a shared internal secret is
still privileged internal-service authority, not protection against a compromised
internal service. Existing private-network/shared-secret assumptions remain.

This pass changes only regression tests and documentation. Auth configuration,
credential handling, token/session contracts and production routes remain as
previously implemented. P14.1–P14.20 of the revised request are covered by the
retained implementation plus these additional ownership/boundary checks.

## Pre-change audit

Baseline `498fbce`. Auth owns registration/login, RS256 signing, public JWKS,
hashed server-side refresh-token records, refresh rotation/reuse detection and
logout. Gateway verifies signature/issuer/audience/expiry/type, then constructs
trusted identity headers behind the Phase 13 allowlist. Database email uniqueness
and CUSTOMER-only registration already exist. Passwords use salted scrypt and
timingSafeEqual, but synchronous default N=16384/r=8/p=1 blocks the event loop,
minimum length is six, no upper bound exists, malformed hash hex can throw, and
unknown users skip derivation. Login errors are already generic; registration
deliberately exposes duplicate-account conflict. Email lowercasing is consistent
in controllers but validation runs before trimming.

Tokens include mutable email/name, role, type and standard issuer/audience/subject/
iat/exp, but no jti; same-second refresh issuance can produce identical tokens.
TTLs are hardcoded 15 minutes and seven days. Verification does not require all
critical claims, constrain roles/lifetime/iat, or select by kid. Key files/env are
imported before startup but no pair matching/private-field JWKS projection exists.
Gateway caches only the first JWKS key indefinitely; rotation cannot refresh it.

Refresh records already store SHA-256 digests, expiry, revocation and replacement
links. However, rotation re-reads without a lock or active-state check, allowing
concurrent reuse; logout suppresses database failures. Register user creation and
refresh persistence are separate. Readiness checks DB after startup key imports,
without checking later key reload failure. No dedicated Auth integration suite
exists. Existing Gateway limiter policy is appropriate and will be reused.

## Authentication architecture

```text
REGISTER / LOGIN
Client credentials
  -> Phase 13 Gateway CORS, size and auth/IP rate limits
  -> Auth validation / normalized email / async scrypt
  -> User DB (unique normalized email, server-owned role)
  -> Auth-only active RS256 signer
  -> access JWT + refresh JWT + sanitized user response

AUTHENTICATED REQUEST
Client Bearer JWT
  -> Gateway reads kid, never a client-specified key URL
  -> cached public key or bounded/single-flight JWKS refresh
  -> signature, algorithm, issuer, audience and strict claims
  -> Phase 13 sanitization / reconstructed trusted user ID and role
  -> fixed internal service target

KEY ROTATION
K1 signer/verifier -> K1 verifier + K2 signer/verifier -> K2 only
```

Auth routes remain behind the configured internal Gateway secret. Gateway exposes
the existing public Auth routes and protects `/auth/me`; all existing service
authorization and Phase 13 forwarding policies remain. No private key belongs in
Gateway configuration or shared modules. Shared code holds only public-key
validation, token verification and nonsecret policy defaults.

## Credential policy and registration/login

Scrypt remains the algorithm. New hashes use N=131072, r=8, p=1, a random 16-byte
salt and 64-byte derived key, with native asynchronous crypto and constant-time
comparison. This cost follows the [OWASP scrypt guidance](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#scrypt).
Fixed work factors prevent operator/client downgrades; there is no new hash-cost
environment setting. Hashes record parameters as `scrypt:131072:8:1:salt:digest`.
Existing `salt:digest` records retain the previous N=16384/r=8/p=1 verifier and
upgrade after successful login, using a conditional update against the old hash.
No offline credential migration or password reset is required. Native work uses
about 128 MiB per current-cost derivation; provision memory for concurrent native
worker tasks. This does not add a global Auth concurrency-control platform.

Registration requires 12..128 JavaScript string units; login accepts 1..128 to
support existing passwords. Whitespace-only passwords fail. Passwords are never
trimmed, normalized or truncated and have no character-class requirements.
The upper bound also bounds UTF-8 input size. Unknown accounts and malformed stored
hashes perform a current-cost dummy derivation before rejection. Legacy hashes
have a lower cost until upgraded, so this is not a claim of identical end-to-end
timing. Missing users and wrong passwords return the same 401 envelope/message.
Malformed credential shapes return existing 400 validation errors.

Email normalization is trim + lowercase only, before validation and DB access;
plus tags and dots are preserved. Names trim outer whitespace and are 3..100 units.
Registration ignores client role fields and always stores CUSTOMER; the DB Role
enum and shared JWT role union allow only CUSTOMER and ADMIN. No new permissions
hierarchy or account-management API was added.

Email uniqueness remains a DB constraint. Pre-checks preserve the useful existing
409 duplicate-account response, and a concurrent P2002 race maps to the same
response. Registration deliberately reveals duplicate email existence; login does
not. Rate limits reduce basic probing but do not eliminate enumeration. User
creation and refresh-token persistence commit together; signing/persistence failure
rolls registration back. Password hashing runs before opening that transaction.
Login DB failures retain shared safe 503/500 semantics and correlation IDs.

## Exact JWT contract

Header: `alg=RS256`, `typ=JWT`, and a nonempty kid matching
`[a-zA-Z0-9_-]{1,128}`. Token-provided jku/x5u/embedded keys do not select trusted
verification material. Gateway uses only its configured Auth JWKS URL, does not
follow JWKS redirects, and never derives an upstream URL from kid.

Required payload:

| Claim | Contract |
| --- | --- |
| iss | Configured issuer; default fitsupply-auth-service |
| aud | Matches configured audience; default fitsupply-api; standard JOSE audience-array semantics apply |
| sub | Stable nonblank user ID string, at most 200 units |
| iat | Integer issuance time, no further into future than configured skew |
| exp | Integer expiry greater than iat; duration cannot exceed configured TTL |
| jti | Fresh native random UUID on every issuance, including same-second refreshes |
| type | access or refresh, matching the caller's expected token type |
| role | Server-owned CUSTOMER or ADMIN |

JOSE verifies signature, RS256-only algorithm, issuer, audience, expiry and nbf if
present. Both signing and verification use shared validated policy. Default access
TTL is 900 seconds; refresh TTL is 604800 seconds. Default clock tolerance is five
seconds. Access tokens may be accepted within that skew after nominal expiry;
refresh DB expiry remains an additional strict server-side check. Tokens omit
email/name, passwords, hashes, secrets and key material. User profile information
remains in the existing sanitized API response. JWTs are signed, not encrypted;
user ID and role remain readable by token holders.

## Signing-key ownership and runtime rotation

Auth supports the existing Base64 private/public JWK variables or `keys/private.json`
and `keys/public.json` fallback. No ephemeral keys are generated. Missing, malformed,
weak/non-RSA, mismatched or unusable signing material fails startup. Legacy pairs
without kid receive a stable JOSE SHA-256 JWK thumbprint ID. Published keys contain
only kty, kid, use=sig, alg=RS256, n and e; private fields are rejected in public
inputs. RSA public keys use exponent AQAB and at least 2048-bit material. Startup
performs an actual sign/verify proof, not just two independent imports.

For runtime rotation, set Auth-only `JWT_KEYRING_FILE` to a protected local JSON
file (takes precedence over legacy key variables/files):

```json
{
  "activeKid": "K2",
  "privateKey": { "kty": "RSA", "kid": "K2", "n": "...", "e": "AQAB", "d": "...", "p": "...", "q": "...", "dp": "...", "dq": "...", "qi": "..." },
  "keys": [
    { "kty": "RSA", "kid": "K1", "use": "sig", "alg": "RS256", "n": "...", "e": "AQAB" },
    { "kty": "RSA", "kid": "K2", "use": "sig", "alg": "RS256", "n": "...", "e": "AQAB" }
  ]
}
```

The placeholders are illustrative, not valid deployable key material. Generate
keys with an established JOSE/cryptographic tool. Only the active private key is
needed; old keys are public verification-only. Protect file permissions and mount
the containing directory into Auth, never Gateway. Auth polls on use/readiness
every five seconds by default, coalesces concurrent loads, validates the complete
replacement and swaps it as one key set. Invalid replacements fail closed for
issuance/JWKS/readiness after the reload interval; `/health` remains available.
Duplicate kids and changing a retained kid's key material are rejected. Keep IDs
globally unique across rotations, including after restarts.

Normal operational rotation:

1. Generate K2 securely. Atomically replace the keyring within the same mounted
   directory with K1 still active and both public keys published. Never overwrite
   the live file partially or mount only a single replaceable file inode.
2. Verify Auth readiness/JWKS on every Auth instance. Allow the configured JWKS
   cache/cooldown warm-up period; prepublication avoids unknown-kid cooldown gaps.
3. Atomically activate K2 with its matching private key, retaining K1 public data.
   Confirm new tokens carry K2 and old/new tokens verify through Gateway. Neither
   Gateway nor internal services need restart for this rotation.
4. Record when every old signer stopped. Keep K1 until the longest previously
   configured token TTL (including refresh) plus clock skew has elapsed since
   the final K1 issuance. With defaults this is at least seven days plus skew,
   not merely the 15-minute access lifetime. Decreasing a new TTL does not shorten
   old tokens' actual validity or required key retention.
5. Remove K1 public data atomically; verify K2 remains valid and retired/expired
   K1 tokens fail. At most eight public verification keys are supported.

Environment-only rotation requires restarting Auth to change its environment,
while Gateway still refreshes without restart. Runtime file mode avoids that Auth
restart. There is no key-management SaaS, administrative rotation endpoint or
automatic key generator. Deployment/orchestration and secure key custody remain
operator responsibilities.

## Gateway JWKS cache and outages

Each process/loader caches by kid for 60 seconds by default. A missing kid can
trigger one refresh if the global 10-second cooldown permits; concurrent fetches
share one promise. Random kids cannot allocate a per-attacker cache or trigger a
network fetch per request. Malformed/missing kid or wrong algorithm rejects before
fetch. Unknown kid after a successful refresh returns generic 401. Known-kid
signature failure does not force another fetch; rotation must use a new kid.

JWKS refresh replaces the complete map atomically, removing retired keys. The
loader accepts at most eight unique public RSA signing keys and a 64 KiB parsed
JWKS text limit. Phase 11 dependency timeout still bounds fetch and body reading;
no inner retry policy was added. JWKS is obtained only from configured Auth.

During refresh failure, an already cached suitable key remains usable for at most
cache TTL plus stale grace (default 60+300 seconds from the last successful fetch).
Successful requests still verify signature and all claims. Failure never advances
freshness. Once this bound expires, or if no suitable key exists and refresh is
unavailable, Gateway fails closed with fixed 503. A successful refresh that lacks
the requested kid returns 401; it never resurrects a removed key. Cooldown also
applies after failures. Infrastructure, invalid token and unknown kid retain
distinct internal paths without disclosing hosts, ports, key contents or stacks.

Compromise response may deliberately remove K1 before ordinary retention ends.
That invalidates its tokens after caches refresh; unavailable JWKS can extend
cached acceptance to the documented stale bound. For immediate fleet invalidation,
operators must flush/restart all Gateway caches or stop affected ingress through
deployment controls. This phase does not claim immediate distributed revocation.

## Refresh, logout, revocation and role freshness

Refresh JWTs already existed and remain stateful: high-entropy per-issuance jti,
signature/type/expiry checks, SHA-256-only DB token digests, unique tokenHash,
revokedAt, expiry and replacement links. Rotation locks the owning User row,
rechecks stored ownership/active/expiry state, creates the successor and revokes
the predecessor in one transaction. Concurrent reuse admits at most one successor;
the losing/reused request revokes all currently active refresh credentials for
that user. Reuse revocation commits before the external 401 is thrown.

Logout now takes the same user lock and revokes all active refresh credentials
for the token's user, including a successor created by a concurrent refresh.
This deliberately logs out all refresh sessions for that account, matching the
existing account-wide reuse-response model; there is no new session-family schema.
Missing/unknown/expired tokens remain idempotent successes; expiry is rechecked
under the user lock so expired credentials cannot revoke newer sessions. Database failure returns a
safe error instead of claiming successful revocation. Cleanup retains even revoked
records until fourteen days after original expiry so live-token reuse evidence
does not disappear prematurely. Refresh/logout bodies are shape/length validated.

Access tokens remain stateless until expiry plus configured skew. Logout, refresh
revocation, password change or role change does not instantly revoke issued access
JWTs. No blacklist or per-request DB lookup was added. Role claims come from DB;
refresh/login use the currently read DB role. Already-issued tokens retain the old
role until expiry, including after demotion. No password-change/reset endpoint or
administrative role-management flow was introduced.

## Configuration, rollout and limits

Set identical contract values in Auth and Gateway; defaults live once in shared
policy. Development Compose reads each service's existing `.env`; root
`.env.example` documents the new values. All integer overrides reject blank,
fractional, out-of-range and nonnumeric values. Issuer/audience must be nonblank.

| Variable | Default | Range / ownership |
| --- | --- | --- |
| JWT_ISSUER | fitsupply-auth-service | Auth + Gateway |
| JWT_AUDIENCE | fitsupply-api | Auth + Gateway |
| JWT_ACCESS_TTL_SECONDS | 900 | 60..3600; Auth + Gateway |
| JWT_REFRESH_TTL_SECONDS | 604800 | 3600..2592000; Auth + Gateway |
| JWT_CLOCK_TOLERANCE_SECONDS | 5 | 0..60; Auth + Gateway |
| JWKS_CACHE_TTL_MS | 60000 | 1000..3600000; Gateway |
| JWKS_STALE_MS | 300000 | 0..3600000; Gateway |
| JWKS_REFRESH_COOLDOWN_MS | 10000 | 1000..60000; Gateway |
| JWT_KEY_RELOAD_MS | 5000 | 100..60000; Auth |
| JWT_KEYRING_FILE | absent | Auth-only runtime keyring; otherwise legacy sources |
| JWT_PRIVATE_KEY_BASE64 / JWT_PUBLIC_KEY_BASE64 | absent | Auth-only existing JWK sources or mounted key files |

Deploy Auth and Gateway together with matching policy. Previous-format tokens
without jti/required claims are intentionally rejected, including existing refresh
JWTs: clients must authenticate again. User records/passwords remain intact;
refresh rows expire under normal cleanup. No DB migration/reset is required.
Changing TTL also changes the accepted lifetime contract, so coordinate reductions
with old-token expiry or explicitly treat them as revocation. API response shapes
remain accessToken/refreshToken/user; user profile remains in sanitized user data.

Phase 13 general/auth/refresh limits remain unchanged. No second Auth limiter,
account lockout, Redis, OAuth/OIDC, external IdP, MFA, password-reset/email flow,
permission engine, immediate access-token revocation, metrics or tracing was added.
Counters and key caches are process-local; multiple instances require coordinated
policy/keyring rollout and resource provisioning. Auth/internal services must
remain private and enforce Gateway secret validation.

## Logging and verification

Existing AsyncLocalStorage correlation and structured logging remain. Request
headers/bodies are not logged; token/password/hash/key fields retain shared
redaction. Key/JWKS failures use fixed safe messages without carrying raw material
as causes. JWT verification errors expose generic 401; unavailable keys expose
fixed 503. Existing shared JOSE classification distinguishes token failures from
infrastructure failures. No raw credential, JWT, refresh token or private JWK is
added to operational logs.

Tests cover required/invalid claims, expiry/nbf/skew rules, issuer/audience,
algorithm confusion, payload/signature modification, attacker key URLs/embedded
keys, bounded cooldown/single-flight/stale behavior, public-only JWKS, matching
private/public keys, credential hashing/policy/legacy compatibility, DB uniqueness,
registration rollback, refresh/logout races, reuse retention, role freshness and
runtime keyring rotation. Real Gateway HTTP tests verify K1/K2 overlap, spoofed
identity replacement, unknown-kid limits, outage bounds and retired-key rejection.
Real Auth HTTP/DB test advances beyond K1 refresh lifetime before retirement.
Exact final suite counts and commands are in `TESTING.md`.

Phases 15 and 16 were not started. No infrastructure, dependencies or database
schema changes were added. Existing Notification and Catalog coverage gaps remain
outside this phase; Auth now has a dedicated integration suite.
