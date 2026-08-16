# Vercel deployment preparation

This project is prepared for a **frontend-only Vercel deployment**. The repository contains a Vite React customer application whose production browser assets are emitted to `dist/public` by the existing `pnpm build` command.

## Project settings

| Setting | Value |
|---|---|
| Framework preset | Vite |
| Install command | `pnpm install --frozen-lockfile` |
| Build command | `pnpm build` |
| Output directory | `dist/public` |
| SPA fallback | `vercel.json` rewrites application routes to `/index.html` |

The fallback is required because Wouter handles routes in the browser. Vercel's Vite guidance recommends a root `vercel.json` rewrite for deep links in a Vite SPA. The committed configuration also adds long-lived immutable caching for generated assets.

## Important API boundary

The current `vercel.json` is intentionally a **static frontend configuration**. Its catch-all rewrite is suitable while the app uses mocked repositories. It must not be treated as a production API proxy: when live APIs are introduced, add an `/api/:path*` rewrite before the SPA fallback only if the backend origin, authentication model, CORS policy, and cache policy have been explicitly approved.

The current Express server bundle is not automatically converted into Vercel Functions by this configuration. For a Vercel-hosted full-stack deployment, choose one of these deliberate paths before connecting production data:

1. Deploy the API as a separate service and configure a scoped external `/api/:path*` rewrite to that origin.
2. Convert the server routes into Vercel-compatible Functions or adopt a Vite full-stack adapter such as Nitro.
3. Keep the API on Manus hosting and deploy only this browser frontend to Vercel, with the API base URL supplied through a Vite environment variable.

Do not add API secrets to `VITE_*` variables; those values are exposed to browser code. Public API base URLs may use `VITE_*`, while tokens, database credentials, payment secrets, and signing keys must remain server-side.

## Verification before deployment

Run the following locally and require all commands to pass:

```bash
pnpm check
pnpm test
pnpm build
```

After connecting the repository to Vercel, validate a preview deployment by opening the root route and direct deep links such as `/shipments`, `/send`, `/invoices`, and `/settings`. Confirm that generated assets load, browser navigation remains client-side, and API routes are not accidentally captured by the SPA fallback.

## Hosting note

Manus provides built-in hosting and custom-domain support for this project. Vercel is an optional frontend-hosting path and may require additional configuration once the API becomes live.

## References

[1] [Vercel: Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite)

[2] [Vercel: Static Configuration with vercel.json](https://vercel.com/docs/project-configuration/vercel-json)

[3] [Vercel: Rewrites](https://vercel.com/docs/routing/rewrites)
