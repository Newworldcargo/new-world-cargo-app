# Vercel deployment preparation
This project is prepared for a Vite React deployment with a **constrained same-origin Backend-for-Frontend (BFF)**. Browser assets are emitted to `dist/public` by the existing `pnpm build` command, while `api/gateway.ts` runs as a Vercel Function.

## Project settings

| Setting | Value |
|---|---|
| Framework preset | Vite |
| Install command | `pnpm install --frozen-lockfile` |
| Build command | `pnpm build` |
| Output directory | `dist/public` |
| SPA fallback | `vercel.json` rewrites application routes to `/index.html` |
| Secure API path | `/api/gateway/v1/:path*` rewrites to the BFF Function before the SPA fallback |

The fallback is required because Wouter handles routes in the browser. Vercel's Vite guidance recommends a root `vercel.json` rewrite for deep links in a Vite SPA. The committed configuration also adds long-lived immutable caching for generated assets.

## Important API boundary

The Vercel Function is a **same-origin BFF**, not an open reverse proxy. It accepts only the frontend adapter's explicit `/v1` route and method pairs, checks the canonical portal origin for mutations, bounds JSON bodies and upstream time, strips browser authorization/cookies and sensitive upstream response headers, and returns `Cache-Control: private, no-store, max-age=0` for BFF responses.

The current Express server bundle remains a local/static SPA runtime and is not the BFF. The actual Cargo API must be separately deployed and provide the BFF service-authentication and session-exchange contract described in [`SERVER_SIDE_GATEWAY_ARCHITECTURE.md`](./SERVER_SIDE_GATEWAY_ARCHITECTURE.md). Configure these values only in Vercel Preview and Production: `NWC_BACKEND_ORIGIN`, `NWC_BFF_SERVICE_TOKEN`, `NWC_BFF_ALLOWED_ORIGIN`, and `NWC_BFF_TIMEOUT_MS`. Never add the backend host, service token, database credentials, payment secrets, or signing keys to `VITE_*` variables.

## Verification before deployment

Run the following locally and require all commands to pass:

```bash
pnpm check
pnpm test
pnpm build
```

After connecting the repository to Vercel, validate a preview deployment by opening the root route and direct deep links such as `/shipments`, `/send`, `/invoices`, and `/settings`. Confirm that generated assets load, browser navigation remains client-side, `/api/gateway/v1/not-a-route` returns a JSON `404` rather than `index.html`, and authenticated staging calls reach the BFF without exposing the backend host in browser network destinations.

## Hosting note

Manus provides built-in hosting and custom-domain support for this project. Vercel is an optional frontend-hosting path and may require additional configuration once the API becomes live.

## References

[1] [Vercel: Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite)

[2] [Vercel: Static Configuration with vercel.json](https://vercel.com/docs/project-configuration/vercel-json)

[3] [Vercel: Rewrites](https://vercel.com/docs/routing/rewrites)
