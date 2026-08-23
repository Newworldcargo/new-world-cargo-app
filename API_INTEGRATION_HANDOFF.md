# New World Cargo Frontend API Integration Handoff

**Status:** The customer portal is now **adapter-ready**. Customer pages read through typed query hooks and write through typed mutation hooks. No page imports shared mock fixtures or browser mock persistence directly. The remaining mock data is isolated inside the development adapter and can be replaced by the HTTP adapter through configuration.

> **Activation rule:** Set `VITE_NWC_DATA_MODE=http` and provide `VITE_NWC_API_BASE_URL` only after the backend implements the endpoints and response envelopes in this document. The pages, routes, form UX, cache ownership, and customer-scoped data hooks do not change.

## 1. Implemented Frontend Boundaries

| Frontend layer | Implemented location | Backend responsibility when activated |
|---|---|---|
| HTTP transport | `client/src/api/http.ts` | Serve HTTPS JSON beneath `/api/v1`, set secure session cookies, honour request IDs, and return the documented envelope. |
| Typed DTO contracts | `client/src/api/contracts.ts` | Keep response fields compatible with the Zod schemas; prefer additive changes and version breaking changes. |
| Customer resource port | `client/src/api/ports.ts` | Implement every method with ownership enforcement based on the authenticated session—not a customer ID supplied by the browser. |
| Live adapter | `client/src/api/adapters/http.ts` | Match the endpoint, request body, header, and response-shape matrix below. |
| Development adapter | `client/src/api/adapters/mock.ts` | Development-only implementation; remove only after endpoint contract and staging tests pass. |
| Query and mutation hooks | `client/src/api/hooks.ts` | Return stable responses so invalidation refreshes the affected customer cache. |
| Client-owned state | `client/src/stores/customer-workflow-store.ts` | Do not treat browser drafts or payment preference as server-authoritative records. |
| Session gateway | `client/src/api/auth-gateway.ts` and `client/src/contexts/AuthContext.tsx` | Implement cookie-backed session, profile, verification, logout, and password operations. |

## 2. Customer Ownership and Authorization

All authenticated resource endpoints must derive the **customer ID from the server session**. A route parameter, JSON body, query string, cached record, or browser state must never be accepted as authorization proof.

| Resource | Required server ownership rule | Client behavior already implemented |
|---|---|---|
| Shipments, invoices, addresses, recipients, pickups, support cases, returns, notifications, sessions | Return or mutate only rows owned by the session customer. | Queries are keyed by the authenticated customer and clear on logout. |
| Shipment actions | Validate shipment ownership, current `revision`, and server-calculated `allowedActions`. | Sends `If-Match` and an idempotency key for irreversible action commands. |
| Payments | Validate invoice ownership and unpaid eligibility; provider webhooks determine settled status. | Creates only an intent; it does not claim payment success locally. |
| Files | Validate customer ownership and permitted target purpose before issuing a short-lived upload URL; complete and scan the file before associating it with a customer record. | Requests an upload intent, uploads directly to object storage, then completes the file; no signed URL is persisted. |
| Public tracking | Return public-safe tracking details only and rate-limit requests. | Uses a separate unauthenticated tracking query. |

## 3. Required Transport Contract

The base URL defaults to `/api/v1` and is configurable by `VITE_NWC_API_BASE_URL`. Every response should be JSON in one of these shapes.

```ts
type ApiSuccess<T> = {
  data: T;
  meta?: { nextCursor?: string; total?: number };
  requestId?: string;
};

type ApiProblem = {
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
    retryable?: boolean;
  };
  requestId?: string;
};
```

The browser sends `Accept: application/json`, `X-Request-ID`, cookies through `credentials: include`, and, where applicable, `Idempotency-Key` plus `If-Match`. The server must return `401` for a missing/expired session, `403` for lack of permission, `404` for an unavailable owned record, `409` for an out-of-date revision or invalid transition, `422` for field validation failures, and `429` for public-tracking abuse limits.

## 4. Endpoint Matrix Implemented by the Live Adapter

| HTTP operation | Endpoint | Required request requirements | Response DTO | Frontend workflows |
|---|---|---|---|---|
| `GET` | `/session` | Session cookie | `AuthUser` | App boot and protected routing |
| `POST` | `/auth/login`, `/auth/register`, `/auth/logout`, `/auth/verify`, `/auth/verify/resend` | Cookie issuance or mutation as appropriate | `AuthUser` where applicable | Login, registration, verification, logout |
| `POST` | `/auth/password/verify`, `/auth/password/change`, `/auth/password/reset` | Secrets in request body only; never return them | Empty success | Password workflows |
| `PATCH` / `DELETE` | `/profile` | Session cookie; accepted avatar URL must come from a completed customer-owned file | `AuthUser` for patch | Profile and account deletion |
| `GET` | `/shipments?q=&status=` and `/shipments/:id` | Session cookie | `ShipmentDto[]` / `ShipmentDto` | Home, shipment list, shipment detail, POD eligibility |
| `POST` | `/shipments/:id/actions` | `If-Match`, `Idempotency-Key`, `{ action }` | `ShipmentDto` | Cancel, duplicate, pickup/delivery operations, issue workflows |
| `GET` | `/public/tracking/:trackingNumber` | Rate limited; no session required | Public-safe `ShipmentDto` | Tracking page |
| `GET` | `/invoices?status=` and `/invoices/:id` | Session cookie | `InvoiceDto[]` / `InvoiceDto` | Invoices, unpaid shipment payment eligibility |
| `POST` | `/payments/intents` | `Idempotency-Key`, `PaymentIntentInput` | `PaymentIntentDto` | Payment modal |
| `GET` | `/addresses`, `/recipients?q=` | Session cookie | `AddressDto[]`, `RecipientDto[]` | Settings and Send |
| `POST` / `PUT` / `DELETE` | `/addresses`, `/addresses/:id` | `If-Match` for update/delete | `AddressDto` | Address CRUD |
| `PATCH` | `/addresses/:id/default` | `If-Match` | `AddressDto` | Default pickup address |
| `POST` / `PUT` / `DELETE` | `/recipients`, `/recipients/:id` | `If-Match` for update/delete | `RecipientDto` | Recipient CRUD and Send reuse |
| `GET` | `/reference-data` | Public or authenticated reference policy | `CustomerReferenceData` | Offices, delivery choices, transport choices |
| `POST` | `/files/upload-intents` | `Idempotency-Key`, `FileUploadIntentInput` | `FileUploadIntentDto` | Debit-note, proof, support attachment, and profile-photo upload handoff |
| `POST` | `/files/:fileId/complete` | Session cookie after the direct object-storage upload | `UploadedFileDto` | File scanning/completion and profile-photo association |
| `GET` / `PATCH` / `POST` | `/notifications`, `/notifications/:id/read`, `/notifications/read-all` | `If-Match` / `Idempotency-Key` as applicable | `NotificationDto[]` / `NotificationDto` | Notification centre |
| `GET` / `POST` | `/support/cases` | `Idempotency-Key` for create | `SupportCaseDto[]` / `SupportCaseDto` | Support cases |
| `GET` / `POST` | `/returns` | `Idempotency-Key` for create | `ReturnRequestDto[]` / `ReturnRequestDto` | Return workflow |
| `GET` / `POST` | `/pickups/current`, `/pickups` | `Idempotency-Key` for scheduling | `PickupDto` | Pickup workflow |
| `POST` | `/pickups/:id/cancel` | `If-Match`, `Idempotency-Key` | `PickupDto` | Pickup cancellation |
| `GET` / `PATCH` / `DELETE` | `/security/sessions`, `/security/sessions/:id/trust`, `/security/sessions/:id` | `If-Match`; idempotency for revoke | `SessionActivityDto[]` / `SessionActivityDto` | Sign-in activity and session security |

## 5. Persistence and Concurrency Requirements

Server storage is authoritative for all customer and operational data. The frontend stores only unsent shipment draft content, current quote handoff, and a non-sensitive last-used payment preference in its Zustand store. It clears that store and the entire query cache on logout or account deletion.

| Server record | Persistence rule | Concurrency / idempotency requirement |
|---|---|---|
| Customer and session | Passwords must be salted and hashed; session token stays in an `HttpOnly`, `Secure`, `SameSite` cookie. | Session invalidation must revoke all protected access immediately. |
| Shipment, pickup, delivery, address, recipient, notification, session device | Persist a monotonically increasing `revision`. | Reject a stale `If-Match` revision with `409` and return a safe recovery message. |
| Shipment creation, actions, payment intents, uploads, support cases, returns, pickup scheduling/cancellation | Persist an idempotency record per authenticated customer and operation. | Replaying the same key must return the original outcome, never create a duplicate record. |
| Files | Store bytes in object storage; store only metadata, ownership, purpose, scan state, and key in the database. | Issue short-lived upload URLs and complete/scan before attachment association. |
| Payments | Persist provider reference and webhook events separately from invoices. | Only a verified provider webhook may move an invoice to paid. |

## 6. Adapter Activation and Mock Removal

The application currently defaults to `mock` mode. This preserves local UX testing while the backend is built. The backend activation sequence is intentionally gradual.

1. Implement `/session`, profile, shipments, invoices, addresses, recipients, and reference data in a staging environment.
2. Verify every response against the Zod schemas in `client/src/api/contracts.ts` and run contract tests against staging.
3. Start the frontend with `VITE_NWC_DATA_MODE=http` and `VITE_NWC_API_BASE_URL=https://<staging-api>/api/v1`.
4. Run the customer smoke flows: login, customer-specific home/list/detail, address CRUD, recipient reuse, public tracking, notification read, support case, return, pickup, and sign-in-session management.
5. Enable payment, upload, and shipment-action endpoints only after idempotency, webhook, malware-scan, and authorization tests pass.
6. Remove the mock adapter, legacy mock fixtures, and browser mock repository only after the live adapter is exercised by the full regression and staging suites.

## 7. Backend Go-Live Checklist

| Gate | Required evidence |
|---|---|
| Contract compatibility | OpenAPI/DTO contract tests pass against staging and production candidate. |
| Ownership enforcement | Cross-customer access tests return `403` or `404` without leaking record existence. |
| Reliability | Health/readiness endpoints, request-ID logs, bounded retries, and alerting are in place. |
| Financial correctness | Payment statuses originate from verified webhooks and duplicate payment-intent tests pass. |
| File safety | Upload authorization, type/size validation, malware scan, and signed URL expiration tests pass. |
| Privacy | No token, payment credential, or server-owned data is persisted in browser storage. |
| Rollback | The data-mode flag can return the staging build to mock mode while an incident is investigated. |

## 8. Current Readiness Statement

The frontend **is prepared to plug into live APIs without page rewrites**. It is not a live backend: the current default adapter still supplies development fixture data. The backend team must implement the documented routes, cookies, ownership checks, revision and idempotency rules, and response DTOs before a production data-mode switch.
