# Server-side API Gateway Architecture

## Decision

Use a **same-origin API gateway** hosted as a Vercel Function. The browser will call only this portal's same-origin gateway path, for example `/api/gateway/v1/...`. The Vercel Function forwards the allow-listed request to the Laravel customer API at `https://api.newworldcargo.com/api/v1`. The frontend deployment does not require API environment variables; Laravel remains the only system that owns backend env and secrets.

The current Vite application is not a Next.js App Router application, so it cannot use Next.js `"use server"` actions without a deliberate framework migration. A Vercel Function provides the needed server-side boundary without rewriting the customer portal as Next.js.

## What this protects

| Concern | Result with Gateway |
| --- | --- |
| Backend implementation details | Browser code calls only the same-origin gateway route. |
| Browser API calls | Browser calls only `/api/gateway/v1/...`. |
| CORS to the backend | Eliminated for portal-to-gateway traffic. |
| Request authorization | Laravel validates the customer session and derives the customer identity. |
| Sensitive response caching | Gateway marks API responses `no-store`; only reviewed static assets use long-lived caching. |

## Important limitation

This does **not** make browser-supplied information invisible to the person using the browser. A user can always inspect their own submitted payload and their own rendered response. The gateway prevents frontend code from becoming an unrestricted proxy and keeps authorization in Laravel.

## Vercel implementation evidence

Vercel Functions can run a small Node handler that validates the requested route, forwards it to Laravel, and returns the upstream JSON response. [Vercel Functions API Reference](https://vercel.com/docs/functions/functions-api-reference)

Vercel rewrites can proxy an external origin and hide the destination URL, but a rewrite alone cannot add the route allow-list, body limit, origin check, and header filtering required for this portal. Authenticated API traffic should use the gateway Function. [Vercel Rewrites](https://vercel.com/docs/routing/rewrites)

## Frontend Configuration

The frontend has no API environment variables. The browser transport is fixed to the relative same-origin path `/api/gateway/v1`, and the Vercel Function forwards to the production Laravel API. Backend secrets, mail, payment, database, and customer-session configuration stay in Laravel.

## Gateway invariants

1. Allow-list only the frontend routes already defined by the API adapter; never make an unrestricted open proxy.
2. Forward only required request headers. Remove browser-supplied authorization, host, forwarding, and internal headers.
3. Forward only the reviewed Laravel session cookies required by the customer API; do not trust a customer ID supplied by the browser.
4. Enforce request size limits, timeouts, CSRF/origin checks for state-changing operations, and request IDs.
5. Preserve upstream HTTP status and safe response headers, and relay only the reviewed Laravel customer-session cookies.
6. Return `Cache-Control: no-store` for authenticated, wallet, invoice, profile, payment, support, and mutation traffic.
7. Stream uploads only through reviewed presigned-upload workflows; the gateway must not buffer arbitrary file payloads.
8. Emit structured logs with correlation IDs, route class, status, duration, and no personal or payment data.

## Session Contract

The gateway is a constrained cookie relay for Laravel's customer portal API:

1. After `POST /api/v1/auth/login` or `POST /api/v1/auth/register`, Laravel issues its normal secure customer session and CSRF cookies.
2. The gateway forwards only reviewed cookie names back to the browser.
3. Future same-origin browser calls send those cookies to `/api/gateway/v1/...`; the gateway forwards them to Laravel.
4. Laravel authenticates the session, validates CSRF for unsafe operations, derives the customer identity server-side, and rejects browser-provided customer identifiers as authorization evidence.

## Activation sequence

1. Keep Laravel `/api/v1` healthy and backed by production backend env.
2. Deploy the frontend to Vercel without API env variables.
3. Confirm `/api/gateway/v1/not-a-route` returns JSON `404`.
4. Confirm login, session, public tracking, and protected customer resources work through the gateway.
5. Retain only intentionally public backend endpoints such as sanitized tracking lookup.
6. Monitor gateway errors, latency, and Laravel authorization denials after production cutover.
