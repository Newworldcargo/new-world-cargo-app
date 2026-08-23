# React–Laravel Server-to-Server Integration Report

Date: 2026-08-23

## Outcome

The intended architecture is now represented in the isolated workspaces: the browser calls the React same-origin gateway, the React server calls Laravel server-to-server with a private bearer token, Laravel exchanges the BFF session for a short-lived signed customer assertion, and authenticated requests are forwarded to Laravel’s mounted `/api/v1` routes. Production was not accessed or changed.

The Laravel implementation was committed as `7146049` and pushed to `feature/customer-portal-api-v1` in the existing draft PR [#25](https://github.com/Newworldcargo/Cargo-Mangr/pull/25). The pull request remains open and draft, with `main` as its base. The React repository was changed only in the local sandbox checkout. Its local commits are `0592182` for the Laravel API prefix and `68e2bbe` for the BFF forwarding integration test; neither React commit was pushed.

## Validation results

| Area | Result |
|---|---|
| React dependency installation | Passed with `pnpm install --frozen-lockfile` |
| React TypeScript validation | Passed with `pnpm check` |
| React automated tests | 22 test files passed; 69 tests passed |
| React production build | Passed; Vite and the server bundle were generated |
| Local BFF forwarding test | Passed; the React server exchanged the session and forwarded to `https://.../api/v1/session` |
| Laravel PHP syntax validation | Passed for all portal PHP files |
| Laravel branch publication | Pushed successfully to the isolated feature branch |
| Production | Not accessed, modified, migrated, or deployed |

The local integration test verifies the critical URL and header behavior. It confirms that the BFF requests `/internal/bff/session-exchange`, then forwards the private service authorization and customer assertion to Laravel under the configured `/api/v1` prefix. It uses mocked local responses and does not contact a real server or production account.

## Laravel changes published

The Laravel branch now includes an additive `customer_portal_bff_sessions` migration and model. Raw portal tokens are stored only as hashes. The BFF service issues short-lived signed customer assertions, exchanges HttpOnly portal-session material, validates BFF CSRF tokens, updates last-use timestamps, and revokes sessions on logout. Portal authentication accepts a verified BFF assertion or the existing Laravel web session; it does not trust customer IDs from the browser. BFF requests fail closed if the service token, signing secret, assertion, session, or CSRF token is invalid.

The internal endpoint is `POST /internal/bff/session-exchange`. It requires the private bearer service token and the `X-NWC-Portal-Session` header. Laravel login and registration return `X-NWC-BFF-Session` and `X-NWC-BFF-CSRF-Token` only when the BFF service token is configured on the request. The public versioned API remains under `/api/v1`.

## Required staging configuration

The React server must hold `NWC_BACKEND_ORIGIN`, `NWC_BACKEND_API_PREFIX=/api`, `NWC_BFF_SERVICE_TOKEN`, `NWC_BFF_SHARED_SECRET`, and `NWC_BFF_ALLOWED_ORIGIN` as server-side secrets or configuration. Laravel must hold the matching service token and signing secret as environment values. The browser must never receive the service token.

Staging still needs the authorized Composer private package, a sanitized database, the additive migrations, real non-production customer accounts, and browser-based verification of login, exchange, session renewal, CSRF, ownership isolation, logout, and error handling. The Laravel application has not been runtime-booted locally because the private Composer dependency remains unavailable in this sandbox.

## Remaining gate

This is ready for controlled staging deployment, not production activation. After staging proves the full handshake against non-production accounts, the draft PR can undergo normal review. Do not merge, migrate production, or enable the React HTTP mode against production before the staging gates in the portal runbook pass.
