# Server-side API Gateway Architecture

## Decision

Use a **same-origin Backend-for-Frontend (BFF)** hosted as a Vercel Function. The browser will call only this portal's same-origin gateway path, for example `/api/gateway/v1/...`. The Vercel Function will call the separately deployed Cargo backend using server-only environment variables. This is preferable to exposing the external backend URL directly through `VITE_NWC_API_BASE_URL`.

The current Vite application is not a Next.js App Router application, so it cannot use Next.js `"use server"` actions without a deliberate framework migration. A Vercel Function provides the needed server-side boundary without rewriting the customer portal as Next.js.

## What this protects

| Concern | Result with BFF |
| --- | --- |
| Backend host and server credentials | Hidden from browser code and network destinations. |
| Browser API calls | Browser calls only the portal's same-origin BFF route. |
| CORS to the backend | Eliminated for portal-to-BFF traffic; the backend should accept only the BFF's server authentication where possible. |
| Request authorization | The BFF validates the portal session and forwards only server-derived identity context or a server credential. |
| Sensitive response caching | BFF marks authenticated and financial responses `no-store`; only explicitly public tracking responses may be cached under a reviewed policy. |

## Important limitation

This does **not** make browser-supplied information invisible to the person using the browser. A user can always inspect their own submitted payload and their own rendered response. The BFF prevents clients from learning the real backend origin or server secrets, centralizes authorization, and prevents the frontend from directly using privileged backend credentials.

## Vercel implementation evidence

Vercel Functions accept a standard web `Request`, can forward `request.signal` to an upstream `fetch`, and can read server environment variables during Function execution. [Vercel Functions API Reference](https://vercel.com/docs/functions/functions-api-reference)

Vercel rewrites can proxy an external origin and hide the destination URL, but a rewrite alone cannot add the authorization and secret-handling policy required for this portal. It may still be useful for public static resources; authenticated API traffic should use the BFF Function. [Vercel Rewrites](https://vercel.com/docs/routing/rewrites)

Vercel environment variables are encrypted at rest and available at Function execution time; values must be configured separately for preview and production. [Vercel Environment Variables](https://vercel.com/docs/environment-variables)

## Required server-only configuration

| Variable | Purpose | Browser visibility |
| --- | --- | --- |
| `NWC_BACKEND_ORIGIN` | HTTPS origin of the real Cargo backend, without a trailing slash. | Never expose. |
| `NWC_BFF_SERVICE_TOKEN` | Rotatable BFF-to-backend credential, if the backend uses service authentication. | Never expose. |
| `NWC_BFF_ALLOWED_ORIGIN` | Canonical portal origin for origin validation. | Never expose. |
| `NWC_BFF_TIMEOUT_MS` | Upstream timeout, bounded to a safe server-side maximum. | Never expose. |

The browser-facing build setting becomes `VITE_NWC_DATA_MODE=http`; its base URL should be the relative same-origin BFF path rather than an external backend URL.

## Gateway invariants

1. Allow-list only the frontend routes already defined by the API adapter; never make an unrestricted open proxy.
2. Forward only required request headers. Remove browser-supplied authorization, host, forwarding, and internal headers.
3. Derive user identity from a secure portal session; do not trust a customer ID supplied by the browser.
4. Enforce request size limits, timeouts, CSRF/origin checks for state-changing operations, and request IDs.
5. Preserve upstream HTTP status and safe response headers, but never relay server cookies or internal diagnostics to the browser.
6. Return `Cache-Control: no-store` for authenticated, wallet, invoice, profile, payment, support, and mutation traffic.
7. Stream uploads only through reviewed presigned-upload workflows; the BFF must not buffer arbitrary file payloads.
8. Emit structured logs with correlation IDs, route class, status, duration, and no personal or payment data.

## Session handoff contract

The implemented BFF is intentionally **not** a transparent cookie relay. Its required integration with the real backend is as follows:

1. After a successful `POST /api/v1/auth/login` or `POST /api/v1/auth/register`, the backend returns a short-lived opaque portal-session handle in the internal `X-NWC-BFF-Session` response header and a CSRF value in `X-NWC-BFF-CSRF-Token` where applicable. The BFF, not the backend, writes the portal's `HttpOnly`, `Secure`, `SameSite=Lax` session cookie and strips both internal headers from the browser response.
2. For each BFF route marked as customer-session protected, the Function posts that opaque cookie only to the backend's internal `/internal/bff/session-exchange` endpoint (override with `NWC_BFF_SESSION_EXCHANGE_PATH`). The request is authenticated with `NWC_BFF_SERVICE_TOKEN`.
3. The exchange endpoint returns a short-lived `X-NWC-Customer-Assertion` header. The BFF forwards only that assertion plus the service credential to the requested backend resource. It does not forward the browser `Cookie` or `Authorization` headers.
4. The backend validates the BFF service credential and assertion for every protected resource, derives the customer identity from the assertion, and rejects browser-provided customer identifiers as authorization evidence.

This is an integration contract only: the backend, token issuer, secure session store, rotation policy, and revocation behavior do not exist in this frontend repository and must be delivered before `http` mode is enabled.

## Activation sequence

1. Implement the backend API and a BFF service-authentication or token-exchange contract.
2. Configure the server-only variables in Vercel Preview and Production.
3. Deploy the BFF with its route allow-list in **shadow mode** and compare safe read responses against direct staging requests.
4. Set the frontend transport base to the relative BFF path, remove any public backend base URL from client build settings, and run contract tests.
5. Disable direct public browser access to private backend routes, retaining only intentionally public endpoints such as sanitized tracking lookup.
6. Monitor gateway errors, latency, and authorization denials before production cutover.
