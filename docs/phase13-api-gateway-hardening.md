# Phase 13 — API Gateway hardening

## Pre-change audit

Baseline: `ad7453b`. Express middleware ran correlation, HTTP logging, Helmet,
unrestricted noncredentialed CORS, health, shutdown guard, then routing. No body
parser or size limit ran at the Gateway. All upstream targets were configured,
never taken from request input. All eight proxies used Phase 11 socket timeouts
but translated every transport error to 503; socket inactivity did not establish
an absolute response deadline. Downstream HTTP responses passed through.

JWT verification already enforced RS256, issuer, audience, expiry, and access
token type. JWKS loading was cached, coalesced and bounded. Authorization parsing
accepted any scheme with a second space-separated token. Key rotation remains
Phase 14 work. Protected service prefixes and explicit admin mutations already
existed; `/auth` was public except `/auth/me`. Internal-path blocking compared
literal lowercase paths, leaving case/encoding confusion to audit and correct.

Proxy hooks replaced `x-user-id`, `x-user-role`, internal secret and correlation
headers, but otherwise copied arbitrary client headers. They did not strip other
identity headers, forwarding metadata or Connection-nominated headers. Express
trusted one forwarding hop unconditionally, allowing direct clients to influence
IP-based limits. Existing in-memory limits were hardcoded per service/auth route;
invalid authentication and unknown routes lacked a general edge limit. Unknown
Gateway routes already returned the shared 404 envelope. Helmet was enabled;
downstream headers could overwrite edge headers. Shutdown guard/readiness already
used Phase 2 shared lifecycle; no lifecycle rewrite is needed.

Configuration validated URL syntax, secret, port and Phase 11 timeout. It did not
validate CORS origins, rate parameters, body limits or origin-only upstream URLs.
Shared request logging excludes query strings, headers and bodies; proxy failures
logged raw errors. Domain validation remains owned by services.

Final library audit also found installed http-proxy suppresses `proxyReq` hooks
when an outgoing Expect header exists. Removing Expect before proxy creation
closes that sanitization/deadline bypass; Node has already handled client
100-continue. A real HTTP regression checks identity, body and timeout behavior.

## Final request flow and trust boundary

```text
UNTRUSTED CLIENT
  |
  v
API Gateway
  correlation context / structured completion logging
  Helmet / request-target validation and canonical unreserved escapes
  configured CORS / preflight
  health and readiness (excluded from API rate limits)
  draining guard / socket-IP general limiter
  bounded raw body / UTF-8 and JSON syntax validation
  route-specific auth limits / RS256 JWT verification / admin checks
  internal-route block / existing per-user service limits
  fixed service target / explicit request-header allowlist
  trusted identity + internal secret + fresh hop ID / absolute proxy deadline
  preserve downstream HTTP response or normalize transport failure
  |
  v
INTERNAL SERVICE — domain validation, authorization and business ownership
```

Public routing remains `/auth/*`, except `/auth/me` requires an access JWT.
Auth-sensitive login/register/forgot-password prefixes share the auth limiter;
refresh and refresh-token prefixes share the refresh limiter. Existing service
prefixes `/catalog`, `/inventory`, `/cart`, `/order`, `/payment`, `/shipping`, and
`/notification` require JWTs. Existing admin mutation checks remain in place.
No new Auth endpoints were added. Unknown paths under a configured prefix reach
that service; unknown Gateway prefixes return the shared 404 envelope. Services
still own resource existence, supported methods and domain validation. No guessed
405 table was introduced.

Client identity, including `x-user-*`, `x-authenticated-user`, `x-service-name`,
all `x-internal-*`, and arbitrary extension headers, cannot become internal
authority. Verified `sub` and `role` exclusively populate `x-user-id` and
`x-user-role`. The configured secret exclusively populates `x-internal-secret`,
including public Auth requests. Authenticated proxy requests remove Authorization;
public Auth forwarding permits it for existing Auth contracts. JWT claim design,
issuer, audience, algorithm and token type are unchanged. Only Bearer syntax is
accepted. Key-loader failures return a fixed 503; verification failures return
401. JWKS cache remains process-local, first-key and without rotation support.

Internal services must stay private and enforce the shared secret. Header
sanitization does not authenticate a caller that can bypass the Gateway and
reach an incorrectly exposed service. This phase does not change deployment
networking or the existing shared-secret architecture.

## Forwarding and HTTP framing

Request allowlist:

```text
accept, accept-language, content-type, user-agent
if-none-match, if-match, if-modified-since, if-unmodified-since
idempotency-key, authorization (public Auth only)
```

Host is generated from the configured upstream. Forwarded, X-Forwarded-*, cookies,
client trace identity, proxy credentials, hop-by-hop and unknown headers are
discarded. Connection-nominated client headers are discarded even if otherwise
allowed. A nominated Host cannot remove the Gateway-controlled target Host.
Node can generate its own Connection header; that is not forwarded client state.
Cookies are not used by current API authentication; clients send bearer tokens
and JSON refresh-token bodies. Any future cookie or upload contract needs an
explicit boundary review, not implicit forwarding.

Gateway accepts a valid UUID request ID for client correlation; invalid IDs are
replaced. It always creates trace identity, ignores client trace IDs, and creates
a fresh downstream hop request ID. Response `x-request-id` remains the Gateway
request ID. These IDs are diagnostics, never authentication.

Raw bodies are buffered once under the size cap and forwarded byte-for-byte.
Original Content-Length and Transfer-Encoding are removed; buffered length is
recomputed. Node handles outgoing framing. Node rejects conflicting incoming
Content-Length/Transfer-Encoding before Express; no custom HTTP parser exists.
Response hop headers and Connection-nominated headers are removed. Gateway CORS,
security, rate and correlation headers take precedence over upstream headers.
Other legitimate downstream status, body and end-to-end headers pass through.
Automatic redirects and WebSocket upgrades are not enabled.

## Request targets, body policy and abuse limits

Targets must use origin form beginning with one slash. Absolute URLs, network
paths, malformed percent/UTF-8 encoding, control characters, backslashes, fragment
markers, repeated slashes and dot segments are rejected. Encoded slash, backslash,
question mark, fragment and percent in paths are rejected. Unreserved escapes are
decoded before Express route/admin decisions; `/catalog/%70roducts` has the same
authorization as `/catalog/products`. Internal-path blocks are case-insensitive,
matching Express route behavior. Query syntax is checked for valid encoding;
query values never choose an upstream target. Services own query semantics.
Configured upstreams are HTTP(S) origins with no userinfo, path, query or fragment.
Operators remain responsible for trusted service configuration and DNS.

Default body cap: 1 MiB across all content types and framing, including chunked
requests. Nonempty bodies must declare application/json or application/*+json and
contain valid UTF-8 JSON. Malformed JSON returns 400 without parser internals.
Non-JSON or compressed bodies return 415. Empty bodies and GET without Content-Type
remain valid. No form/multipart/file-upload contract currently exists. No domain
schema is duplicated at the Gateway. Memory use is capped per request, not across
all concurrent requests; no global concurrency limiter was added.

Existing express-rate-limit dependency and MemoryStore are reused. Fixed windows
default to 60 seconds. General API budget is 600 per socket IP, before body/auth
work, including unknown routes and failed authentication. Login/register share
5 per socket IP; refresh aliases share 30. Existing authenticated per-service
budgets remain catalog/inventory 300, cart/notification 100, order/payment/shipping
50 per verified user, each in its own store. Route budget headers describe the
last limiter reached; general budget still applies. Standard RateLimit-* and
Retry-After headers accompany 429; legacy X-RateLimit-* headers remain disabled.
OPTIONS and probes do not spend API budgets. CORS preflight also avoids JWT work.

Express trusts socket IP only (`trust proxy=false`), so spoofing forwarding headers
cannot obtain a new bucket or control protocol/host interpretation. Behind a
reverse proxy, clients share its socket-IP bucket. Adding trusted CIDRs and
distributed enforcement belongs with an explicit deployment topology. Each
Gateway instance has independent in-memory counters, cleared on restart; this is
basic abuse protection, not a WAF or fleet-wide rate limiter.

## Timeouts, failures and graceful shutdown

Phase 11 `PROXY_TIMEOUT_MS` remains the single configured proxy budget: default
30000 ms, valid 1..60000. Existing upstream socket inactivity timeout remains;
an absolute timer now spans outbound request creation through response completion.
It also terminates continuously trickling responses. The competing inbound
proxy-library socket timeout was removed because it could destroy the client
connection before a JSON 504 was emitted. Timers clear on response finish/close;
client disconnect destroys upstream work. There are no Gateway retries, including
POST/PATCH/PUT/DELETE. A timeout does not prove a mutation failed; clients must
reconcile using existing operation/idempotency contracts.

Node server requestTimeout bounds receipt of headers/body using the configured
budget; headersTimeout is min(10000, budget). Node's native timeout sweep controls
the precise receive-timeout detection interval. The outbound absolute budget
starts after body validation; it does not include client upload or JWKS loading.
JWKS keeps its independent bounded Phase 11 dependency call.

Gateway-generated HTTP semantics use `{ "error": { "code", "message" } }`:

| Status | Condition |
| --- | --- |
| 400 | Invalid request target, malformed JSON/UTF-8, invalid parsed body framing |
| 401 | Missing/invalid/expired access JWT or wrong authorization scheme |
| 403 | Disallowed Origin, internal route, or existing admin authorization failure |
| 404 | Unknown Gateway route; downstream 404 remains downstream-owned |
| 413 | Request body exceeds configured cap |
| 415 | Nonempty non-JSON body or compressed content encoding |
| 429 | General, auth, refresh or existing service budget exhausted |
| 502 | Reset, malformed HTTP response, or other proxy transport failure |
| 503 | Refused connection, DNS failure, unavailable JWKS, or draining |
| 504 | Outbound absolute deadline or upstream socket timeout before headers |

Legitimate downstream HTTP responses, including 4xx/5xx, retain their status and
body. Gateway does not reinterpret a domain response as a transport failure or
sanitize arbitrary downstream application bodies. Owning services retain their
safe-error responsibility. If response bytes already reached the client, a later
timeout/reset closes the stream; a second status/envelope cannot be sent. Raw
HTTP parser failures (for example conflicting framing or oversized headers) can
produce native Node 400/431 responses before correlation/security middleware.

Phase 2 shutdown remains unchanged. SIGTERM marks readiness false, stops accepting
connections, rejects newly admitted business work with 503/Connection: close,
and allows accepted proxy responses to finish. Shared 8-second shutdown deadline
can terminate remaining connections earlier than the normal proxy budget.
`/health` remains live; `/ready` reports 503 while draining. Real Gateway HTTP
regression verifies accepted response completion before successful shutdown.

## CORS, security headers and logging

CORS uses exact configured origins, fixed methods GET/HEAD/POST/PUT/PATCH/DELETE/
OPTIONS and explicit allowed request headers: authorization, content-type, accept,
if-none-match, if-match, idempotency-key and x-request-id. Unknown browser origins,
including `null`, return shared 403. No-Origin clients remain allowed. Credentials
are disabled; no wildcard origin policy is used. Unsupported requested methods
or headers are not advertised, so browsers reject those preflights. Responses
expose request ID, limiter fields and Retry-After, including existing exposure
behavior for non-browser clients. Origin is not an authorization credential.

Existing Helmet defaults remain, including nosniff, frame restrictions, referrer,
HSTS and CSP. These preserve the established policy: CSP mainly matters for
browser-rendered documents and does not replace API authorization; no additional
browser policy was introduced. JSON, health, readiness and allowed preflight
regressions pass. Downstream responses cannot override Gateway security headers.
`X-Powered-By` is disabled.

Existing AsyncLocalStorage correlation and structured completion logging remain.
No request headers, bodies, tokens or query values are added to logs. Proxy logs
contain target service name, method, query-free path, status, elapsed/configured
time and a fixed transport classification; raw errors, hosts, ports and stacks
are not serialized. Authentication failures use existing safe shared logging.
Do not put credentials in URL path segments: existing access logs record paths.
No distributed tracing or metrics infrastructure was added.

## Configuration and rollout

| Variable | Default / validation |
| --- | --- |
| GATEWAY_SECRET | Required, nonblank; unchanged |
| AUTH/CATALOG/INVENTORY/ORDER/CART/PAYMENT/SHIPPING/NOTIFICATION_SERVICE_URL | Origin-only HTTP(S); required in production; localhost service defaults in development/test |
| AUTH_SERVICE_URL for JWKS | Same explicit Auth origin; historical auth-service:3001 fallback without override |
| PROXY_TIMEOUT_MS | 30000; integer 1..60000, existing Phase 11 parser |
| GATEWAY_BODY_LIMIT_BYTES | 1048576; integer 1..10485760 |
| GATEWAY_RATE_WINDOW_MS | 60000; integer 1..3600000 |
| GATEWAY_RATE_LIMIT | 600; integer 1..100000 |
| GATEWAY_AUTH_RATE_LIMIT | 5; integer 1..100000 |
| GATEWAY_REFRESH_RATE_LIMIT | 30; integer 1..100000 |
| CORS_ALLOWED_ORIGINS | Comma-separated exact HTTP(S) origins; development/test defaults localhost:5173 and localhost:3000; explicit nonblank value required in production |

Set Gateway variables in `apps/api-gateway/.env` for development Compose; root
`.env.example` documents them. No development secret file was changed. Origins
cannot contain paths, userinfo, query or fragment. Empty non-production CORS list
denies all browser origins; no-Origin clients remain allowed. Production startup
fails without explicit origins and all service URLs. Existing localhost defaults
remain for development/test only. No database migration or dependency install is
required. Review clients needing formerly implicit cookie/custom-header/form
forwarding before rollout; current supported checkout/auth contracts are covered.

## Verification and phase boundary

Gateway behavioral tests cover real RS256 signatures and JWKS HTTP cache loading,
spoofed identity/forwarding headers, role bypass via encoded paths, correlation,
fixed upstream routing, exact body bytes, chunked oversize, invalid UTF-8/JSON,
CORS, security headers, rate-limit spoofing, connection refusal, DNS failure,
reset, invalid HTTP response, hang, trickling responses, conflicting HTTP framing,
readiness and accepted-request SIGTERM drain. Configuration and existing proxy
contract tests verify startup constraints and all eight transport registrations.
Final exact suite results are recorded in `TESTING.md`.

Limits remain: per-instance in-memory budgets; private-service/shared-secret
deployment assumptions; no upload/compressed-body contract; no fleet concurrency
cap; no WAF/ingress/distributed rate limiting; existing JWKS rotation limitations;
native pre-Express parser responses; stream truncation after headers; owning
services' error-body responsibility. Phase 14 Auth improvements and Phase 15
metrics/distributed tracing were not started. No infrastructure was introduced.
