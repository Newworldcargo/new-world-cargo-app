# New World Cargo Customer Portal — Infrastructure Audit v2

**Scope:** This audit reviews the customer portal after the API-adapter migration. It distinguishes implemented frontend controls from the Laravel services that must remain authoritative. The assessment is based on the transport layer, contracts, repository ports and adapters, query hooks, authentication gateway, deployment configuration, test coverage, and production build configuration in this repository.

## Executive assessment

The portal now has a **customer-scoped, API-ready frontend boundary**. Customer pages obtain server-owned records through typed TanStack Query hooks and a transport-neutral repository port rather than importing fixtures directly. The live HTTP adapter uses the same-origin gateway at `/api/gateway/v1`; frontend API environment variables are not required. The current Express entry point is a static SPA host only and must not be treated as the business API.

| Area | Assessment | Evidence in this repository | Release implication |
|---|---|---|---|
| Customer data isolation | Frontend-ready | Customer identifiers are carried through contracts, query keys, and adapter methods; mock data is constrained to `DEMO_CUSTOMER_ID`. | The API must enforce ownership from the session, never a client-supplied ID. |
| API boundary | Frontend-ready | `contracts.ts`, `ports.ts`, mock/HTTP adapters, and `hooks.ts` define the resource seam. | API response envelopes and validation must match the documented DTOs. |
| Server-state handling | Frontend-ready | Customer-scoped TanStack Query keys, 60-second stale time, bounded retry policy, and mutation invalidations. | Backend must return stable IDs, revisions, and authoritative post-write state. |
| Client workflow state | Frontend-ready | Zustand holds only unsent drafts, quote hand-off data, and non-sensitive payment preference. | Server drafts, financial outcomes, and identity data must remain backend-owned. |
| Transport resilience | Frontend-ready | `apiRequest` uses credentials, request IDs, a bounded abort timeout, CSRF header forwarding, and normalized timeout/network errors. | Gateway/API must accept the headers and establish the CSRF cookie contract. |
| Upload safety | Partially frontend-ready | Profile photo checks MIME type and a 5 MB limit; preview object URLs are revoked; upload intent/completion is modeled. | Storage authorization, malware scanning, content inspection, retention, and signed URL policy remain backend-owned. |
| Payment safety | Integration pending | Payment-intent contracts and invalidation pathways exist. UI payment completion is still mock/local until provider confirmation is wired. | Implement provider webhooks, server-side amount/ownership validation, idempotency, refunds, and receipt issuance. |
| Authentication | Boundary-ready | A mock/HTTP session gateway exists; logout and deletion clear query and workflow state. | Implement secure session lifecycle, OAuth, CSRF, rate limits, verification, and a recoverable session-failure UX. |
| Static delivery security | Frontend-ready | `vercel.json` defines SPA fallback, CSP and browser security headers, permissions/referrer policies, and asset caching. | Validate the final CSP against real API, payment, and storage origins in staging. |
| Liveness | Static-only | `/healthz` rewrites to `client/public/health.json` on Vercel. | Deploy real API `/healthz` and dependency-aware `/readyz`; the static response is not database or API readiness. |
| Performance | Improved | Routes are lazy-loaded and Vite uses manual vendor chunks. | Continue bundle monitoring as third-party payment/tracking SDKs are added. |
| Regression coverage | Improved | Architecture and infrastructure-hardening Vitest suites cover adapter, ownership/revision, wallet, transport, profile validation, headers, liveness, and splitting. | Add contract, E2E, staging smoke, and webhook tests with the deployed API. |

## Frontend remediation completed in this audit

The following controls were added or verified after the initial adapter refactor.

| Control | Implemented behavior | Relevant modules |
|---|---|---|
| Request bounds and cancellation | Requests use an `AbortController` with a fixed 15-second timeout. Timeout and unavailable-network conditions normalize to typed errors. | `client/src/api/http.ts` |
| Cookie and CSRF support | Requests include browser credentials, `Accept`, `X-Request-ID`, and `X-CSRF-Token` when the `nwc_csrf` cookie exists. | `client/src/api/http.ts` |
| Wallet as server state | Customer balance is represented by a DTO, repository method, mock/HTTP adapter implementation, cache key, query hook, and dashboard use. Payment intent invalidation refreshes wallet and invoices. | `contracts.ts`, `ports.ts`, `adapters/*`, `hooks.ts`, `query-keys.ts`, `Home.tsx` |
| Profile-photo guardrails | Client validation allows supported image MIME types up to 5 MB, releases blob preview URLs, and uses the modeled upload flow. | `ProfilePhoto.tsx` |
| Browser delivery headers | Content security, anti-MIME-sniffing, framing, referrer, permissions, cache, SPA fallback, and static liveness rules are declared for Vercel. | `vercel.json`, `client/public/health.json` |
| Initial-load reduction | Route modules load lazily, and vendor bundles are split so the React vendor chunk is below the prior 500 kB warning threshold. | `App.tsx`, `vite.config.ts` |
| Audit regressions | Vitest coverage protects transport failure behavior, headers, profile validation/cleanup, liveness config, lazy routes, vendor chunks, and wallet architecture. | `api-architecture.test.ts`, `infrastructure-hardening.test.ts` |

## Residual risks and ownership

The items below are not defects that a static frontend can safely solve. They are mandatory work for the API, platform, and operations layers before a production HTTP-mode launch.

| Priority | Requirement | Owner | Required acceptance criterion |
|---|---|---|---|
| Critical | Authoritative customer authorization | API and database | Every protected query and mutation derives customer/role from the validated session and rejects cross-customer resource IDs. |
| Critical | Live identity and session security | Auth/API | Secure HttpOnly/SameSite cookie lifecycle, rotation/expiry, CSRF issuance/validation, logout invalidation, password/contact verification, and rate limiting are tested. |
| Critical | Financial workflow and webhook truth | Payments/API | Payment intent amount and invoice ownership are server-calculated; provider webhook signatures drive paid/failed/refunded state; UI refreshes only from authoritative status. |
| Critical | Object storage security | Storage/API | Upload intents are scoped and short-lived; objects are scanned and validated before attachment; private downloads use authorized, expiring URLs. |
| High | API deployment architecture | Platform/API | Deploy `/api/v1` behind an explicit same-origin proxy or a carefully configured CORS/credential policy. Do not direct production data mode at the static Express shell. |
| High | API health and observability | Platform/API | Public liveness `/healthz`, private/dependency-aware readiness `/readyz`, structured request-ID logs, metrics, tracing, alerting, and error reporting operate in staging and production. |
| High | Data schema and concurrency | Database/API | Migrations, referential constraints, status transition rules, revision/`If-Match` checks, and idempotency persistence protect every business write. |
| High | API contract confidence | API + frontend | OpenAPI or equivalent generated contract checks, API-adapter tests, and contract CI prevent DTO drift. |
| Medium | Workflows awaiting endpoint completion | API + frontend | Shipment draft/submission, quote, delivery instructions, notification preferences, payment methods, billing summary, and dashboard summary become resources when their backend routes are agreed. |
| Medium | Session outage experience | Frontend + API | Differentiate network/session-service failure from a confirmed unauthenticated response so a transient outage does not falsely route a live customer to login. |
| Medium | Staging validation | QA/Platform | Run cross-origin/cookie, API contract, payment-webhook, upload, authorization, offline/error, accessibility, responsive, and end-to-end smoke tests against a staging environment. |

## HTTP-mode activation gate

Keep the frontend on the fixed same-origin gateway and demonstrate every gate below in staging/production validation.

1. The versioned `/api/v1` service is deployed and reachable from the portal origin through the approved proxy/CORS design.
2. Session-derived authorization is enforced for every protected resource, including nested invoice, shipment, document, return, pickup, and support routes.
3. DTO contract tests validate success, validation, conflict, authorization, and error-envelope behavior against the HTTP adapter.
4. CSRF cookie/header behavior, CORS credential rules, request-ID propagation, timeout behavior, and unauthorized handling have been tested in browsers.
5. Payment and upload flows are backed by secure server processes, with webhook/scan completion and recovery states.
6. API health/readiness, logs, metrics, alerts, backups, migration rollback, and incident ownership are available.
7. A staging smoke suite validates the customer journey using real, customer-scoped records without fixture adapters.

> **Conclusion:** The repository is substantially stronger at the frontend boundary and can consume a correctly implemented API with no planned page rewrite. It is **not yet a live end-to-end customer system**: backend implementation, infrastructure deployment, security controls, and production validation remain required.

## Related documents

- [API integration handoff](./API_INTEGRATION_HANDOFF.md) — endpoint, revision, idempotency, upload, payment, health, and activation contract.
- [API readiness implementation plan](./api-readiness-implementation-plan.md) — migration architecture and ownership conventions.
- [Initial infrastructure audit](./infrastructure-audit.md) — original broader assessment and phased roadmap.
