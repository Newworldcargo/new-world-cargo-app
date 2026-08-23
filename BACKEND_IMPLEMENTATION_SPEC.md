# New World Cargo Backend Implementation Specification

**Document owner:** Backend delivery team with frontend review  
**Audience:** Backend engineers, QA engineers, DevOps, payment and operations integrators  
**Status:** Build specification — required before the customer portal switches from `mock` to `http` data mode  
**API namespace:** `/api/v1`

## 1. Delivery Objective

Build the production backend for the New World Cargo customer portal so that the existing React frontend can consume real, customer-owned information without redesigning its pages, routes, forms, cache model, or customer workflows. The frontend already has a transport-neutral repository, a live REST adapter, Zod schemas, React Query invalidation, CSRF-aware cookie transport, and a configuration switch. The backend must now supply the authoritative data, rules, and integrations.

> **Non-negotiable ownership rule:** The server derives the authenticated customer from the session. It never trusts a customer ID sent by the browser as authorization proof. A customer can only view or change shipments, invoices, wallet information, addresses, recipients, files, notifications, cases, returns, pickups, and security sessions that belong to that authenticated customer.

The implementation should publish an **OpenAPI 3.1** contract and test the running service against it. OpenAPI security schemes can be declared globally or per operation, allowing both people and tooling to understand the API protection model.[1] The service should use HTTPS, perform authorization at every non-public endpoint, validate request content and workflow order on the server, and return standard HTTP semantics.[2]

| Delivery outcome | What “complete” means |
|---|---|
| Customer isolation | Cross-customer reads or writes neither return records nor leak protected fields. |
| Plug-in readiness | The existing HTTP adapter reaches the documented paths and every response validates against `client/src/api/contracts.ts`. |
| Financial correctness | Invoice and wallet state are derived from the ledger and verified payment webhooks, never from a browser success message. |
| Workflow safety | The server owns status transitions, revision checks, idempotency, and permission checks. The frontend is only a client. |
| Operational readiness | HTTPS, secure sessions, CSRF, logs, health/readiness, monitoring, backups, migrations, alerting, and a rollback plan are in place. |

## 2. Boundary and Integration Model

The customer portal has two modes. `mock` is development-only. `http` invokes the API base URL supplied in `VITE_NWC_API_BASE_URL`, or `/api/v1` when the frontend and API share an origin. The live configuration **must not** be enabled until the current-adapter APIs pass staging contract and authorization tests.

| Layer | Existing frontend behavior | Backend delivery requirement |
|---|---|---|
| Session gateway | Uses cookie credentials for session, auth, profile, verification, password, and logout calls. | Issue, validate, rotate, revoke, and expire secure session cookies; publish the documented auth error codes. |
| HTTP transport | Sends `Accept: application/json`, `X-Request-ID`, `credentials: include`, an optional `X-CSRF-Token`, and a bounded request timeout. | Return JSON envelopes, echo/correlate request IDs, accept cookie credentials, validate CSRF on unsafe cookie-authenticated calls, and keep CORS/cookie policy compatible. |
| Resource adapter | Calls the concrete paths in Section 5. | Match method, path, query parameter, headers, body, status, and response schema exactly. |
| React Query | Invalidates affected customer data after writes. | Return committed server state promptly and make reads consistent enough for post-write refresh. |
| Zustand workflow store | Holds only unsent local cargo drafts, quote handoff, and a non-sensitive last payment-method preference. | Do not treat browser values as authoritative; introduce server draft and quote resources before relying on them for operations. |
| Files | Requests signed upload intent, uploads directly, then calls completion. | Authorize purpose, issue short-lived object-storage upload URL, scan/validate, and only then associate the file with a business record. |

### 2.1 Environments and activation variables

| Environment | `VITE_NWC_DATA_MODE` | `VITE_NWC_API_BASE_URL` | Purpose |
|---|---:|---|---|
| Local development | `mock` | Not required | UI and workflow development without a backend. |
| Backend staging | `http` | `https://api-staging.<domain>/api/v1` | Contract, authorization, integration, and smoke testing. |
| Production | `http` | `https://api.<domain>/api/v1` or same-origin `/api/v1` | Customer traffic after all go-live gates pass. |

The frontend static host is not the API. The current project server is only a static SPA host. Deploy the API as a separately managed HTTPS service or place it behind a correctly configured reverse proxy. If a cross-origin architecture is selected, configure a precise origin allowlist, allow credentials, set `Vary: Origin`, and do not use wildcard origins with cookies.

## 3. Global HTTP Contract

All API JSON responses use one of the following envelopes. The frontend already parses this shape.

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

| Contract area | Required rule |
|---|---|
| Content type | Consume and produce `application/json; charset=utf-8` except direct object-storage uploads and controlled document downloads. Reject unsupported request media types with `415`. |
| Request identity | Accept `X-Request-ID` when supplied; generate one if absent; log and return it in every success/error response. |
| Authentication | Cookie-backed session for the browser. Session cookie: `HttpOnly`, `Secure`, `SameSite=Lax` or stricter where the deployment permits, scoped only to the intended domain/path. |
| CSRF | Set a readable, non-`HttpOnly` `nwc_csrf` token cookie. Require its matching `X-CSRF-Token` header for every unsafe authenticated request (`POST`, `PUT`, `PATCH`, `DELETE`), except carefully designed same-site login/verification endpoints. Rotate on login/session renewal. |
| Timeout/retry | The browser has a 1–60 second bounded request timeout. Return `retryable: true` only when a client retry is safe. Never instruct automatic retries for payments, shipment creation, or other non-idempotent commands without an idempotency key. |
| Idempotency | For the operations marked in Section 5, require `Idempotency-Key: <UUID>`. Persist customer ID, operation fingerprint, key, response, and expiry. Same key + same payload returns the original outcome; same key + different payload returns `409 IDEMPOTENCY_KEY_REUSED`. |
| Optimistic concurrency | For revisioned records, require `If-Match: <revision>` on update/action/delete. Increment revision on every committed change. Return `409 REVISION_CONFLICT` with a safe recovery message for stale writes. |
| Time | Store timestamps in UTC. Return RFC 3339/ISO 8601 strings with a timezone (`2026-08-23T08:30:00Z`). Frontend formatting is local. |
| Paging | Current list calls accept no cursor yet. Build cursor-capable lists now using `meta.nextCursor` and `meta.total`; keep the non-paginated response compatible for the current portal. |

### 3.1 Required status and error semantics

| Status | Required meaning | Example codes |
|---:|---|---|
| `200` | Successful read, update, or action with a response body. | — |
| `201` | A resource was created. | `SHIPMENT_CREATED`, `SUPPORT_CASE_CREATED` |
| `202` | Accepted asynchronous work; the response includes the created/processing resource. | `PAYMENT_PROCESSING`, `FILE_SCAN_PENDING` |
| `204` | Successful delete or command with no response body. | — |
| `400` | Malformed request that cannot be validated as a normal field error. | `MALFORMED_JSON` |
| `401` | No valid session or expired session. | `UNAUTHENTICATED`, `SESSION_EXPIRED` |
| `403` | Authenticated user lacks a role/capability. Prefer `404` for customer-owned record isolation if revealing existence is a concern. | `FORBIDDEN` |
| `404` | Public tracking number or customer-owned resource is unavailable. | `NOT_FOUND`, `TRACKING_NOT_FOUND` |
| `409` | Revision, idempotency, duplicate, or state-transition conflict. | `REVISION_CONFLICT`, `INVALID_STATE_TRANSITION` |
| `413` | Upload/request exceeds configured safe size. | `PAYLOAD_TOO_LARGE` |
| `415` | Unsupported file or request content type. | `UNSUPPORTED_MEDIA_TYPE` |
| `422` | Structured validation/business-eligibility failure. Include `fieldErrors` when a form can show field-level messages. | `VALIDATION_FAILED`, `INVOICE_NOT_PAYABLE` |
| `429` | Auth, OTP, or public-tracking rate limit reached. Return `Retry-After`. | `RATE_LIMITED` |
| `5xx` | Unhandled/dependency failure. Do not leak provider, database, or stack details. | `INTERNAL_ERROR`, `DEPENDENCY_UNAVAILABLE` |

The following application error codes are required because the existing login and verification pages already map them to user outcomes: `ACCOUNT_DISABLED`, `CONTACT_UNVERIFIED`, `ACCOUNT_EXISTS`, `OTP_EXPIRED`, `OTP_ATTEMPTS_EXCEEDED`, and `CURRENT_PASSWORD_INVALID`.

## 4. Domain Model and Source of Truth

The database is authoritative. Use immutable identifiers, UTC timestamps, audit timestamps (`created_at`, `updated_at`), soft deletion only where business or legal retention requires it, and a monotonic integer `revision` on every customer-editable or actioned record.

| Aggregate / table family | Required purpose and relationships | Ownership and invariants |
|---|---|---|
| `customers`, `customer_contacts`, `customer_verifications` | Customer profile, verified email/phone, account status. | Every portal session resolves to exactly one customer. Changes to email/phone require fresh verification before becoming primary. |
| `auth_sessions`, `session_devices`, `password_credentials`, `password_resets` | Sessions, trusted-device display, credentials, reset/verification challenges. | Password hashes only; never store plaintext. Session revocation is immediate. |
| `shipments`, `shipment_items`, `shipment_events`, `shipment_actions` | Cargo request/shipment, line items, tracking timeline, auditable commands. | Shipment customer ID is immutable. Status transitions are server-owned. |
| `shipment_drafts`, `quotes`, `delivery_instructions`, `proof_of_delivery` | Incomplete shipment work, quote snapshots, delivery preferences, POD evidence. | Drafts and quotes expire; submission creates or links to a real shipment through a transaction. |
| `invoices`, `invoice_lines`, `receipts`, `payment_intents`, `payment_transactions`, `provider_webhook_events` | Billing, evidence of payment, payment gateway orchestration. | Only verified provider webhook processing can change financial settlement. |
| `wallets`, `wallet_ledger_entries` | Customer balance and movement history. | **One customer is assigned one wallet.** Balance is derived from append-only ledger entries, never edited directly from the UI. |
| `addresses`, `recipients` | Reusable pickup/delivery addresses and contact records. | Owned by customer; at most one default pickup address. |
| `files`, `file_links`, `file_scan_results` | Object metadata and safe associations. | Bytes are in private object storage; records store key, owner, purpose, MIME, size, checksum, scan status, expiry. |
| `notifications`, `notification_preferences` | Customer notification centre and channels/subscriptions. | Notification audience is customer-specific; read state is revisioned. |
| `support_cases`, `support_messages`, `return_requests`, `pickups` | Service cases, return handling, pickup scheduling. | Customer can create/request, while staff workflow transitions are role protected and audited. |
| `idempotency_records`, `audit_events`, `outbox_events` | Replay protection, security/audit history, reliable external event delivery. | Scope idempotency to authenticated customer + operation. Do not expose sensitive audit metadata to customers. |

## 5. API Catalogue

### 5.1 Endpoints that must match the current live adapter

These are the **minimum plug-in API**. Their path, verb, headers, and body are already used in `client/src/api/adapters/http.ts`; changing them requires a coordinated frontend release.

| Area | Method and path | Auth / required headers | Request body or query | Required successful `data` |
|---|---|---|---|---|
| Session | `GET /session` | Session cookie | — | `AuthUser` or `401` |
| Login | `POST /auth/login` | CSRF policy | `{ identifier, password }` | `AuthUser`, sets session + CSRF cookies |
| Register | `POST /auth/register` | CSRF policy | `{ firstName, lastName, email, phone, password }` | Unverified `AuthUser`, creates verification challenge |
| Verify | `POST /auth/verify` | Session/verification context | `{ code }` | Empty success; marks verified |
| Resend verification | `POST /auth/verify/resend` | Session/verification context | — | Empty success, rate limited |
| Password | `POST /auth/password/verify` | Session + CSRF | `{ password }` | Empty success or `CURRENT_PASSWORD_INVALID` |
| Password | `POST /auth/password/change` | Session + CSRF | `{ currentPassword, nextPassword }` | Empty success; revoke/rotate sessions per policy |
| Password | `POST /auth/password/reset` | Define reset-token policy | `{ password }` plus reset proof/session | Empty success |
| Session | `POST /auth/logout` | Session + CSRF | — | Empty success; revokes current session |
| Profile | `PATCH /profile` | Session + CSRF | Any subset of `firstName`, `lastName`, `email`, `phone`, `avatar` | Updated `AuthUser` |
| Profile | `DELETE /profile` | Session + CSRF, recent-auth check recommended | — | Empty success; irreversible account action policy enforced |
| Shipments | `GET /shipments?q=&status=` | Session | `q`, `status=active|delivered` | `ShipmentDto[]` |
| Shipment | `GET /shipments/:id` | Session | — | `ShipmentDto` or `404` |
| Shipment command | `POST /shipments/:id/actions` | Session, `If-Match`, `Idempotency-Key` | `{ action }` | Updated `ShipmentDto` |
| Public tracking | `GET /public/tracking/:trackingNumber` | No session; public rate limit | — | Public-safe `ShipmentDto` subset or `404` |
| Invoices | `GET /invoices?status=` | Session | `status=paid|unpaid` | `InvoiceDto[]` |
| Invoice | `GET /invoices/:id` | Session | — | `InvoiceDto` or `404` |
| Wallet | `GET /wallet` | Session | — | `WalletDto` |
| Payment intent | `POST /payments/intents` | Session, CSRF, `Idempotency-Key` | `{ invoiceId, method: "mobile-money"|"card", idempotencyKey }` | `PaymentIntentDto` |
| Addresses | `GET /addresses` | Session | — | `AddressDto[]` |
| Address | `POST /addresses` | Session + CSRF | `AddressInput` | Created `AddressDto` |
| Address | `PUT /addresses/:id` | Session + CSRF, `If-Match` | `AddressInput` | Updated `AddressDto` |
| Address | `DELETE /addresses/:id` | Session + CSRF, `If-Match` | — | `204` |
| Default address | `PATCH /addresses/:id/default` | Session + CSRF, `If-Match` | — | Updated `AddressDto` |
| Recipients | `GET /recipients?q=` | Session | `q` optional | `RecipientDto[]` |
| Recipient | `POST /recipients` | Session + CSRF | `RecipientInput` | Created `RecipientDto` |
| Recipient | `PUT /recipients/:id` | Session + CSRF, `If-Match` | `RecipientInput` | Updated `RecipientDto` |
| Recipient | `DELETE /recipients/:id` | Session + CSRF, `If-Match` | — | `204` |
| Reference data | `GET /reference-data` | Public or session policy; cacheable | — | Offices, delivery options, transport options |
| Upload intent | `POST /files/upload-intents` | Session + CSRF, `Idempotency-Key` | File name, MIME, size, purpose, idempotency key | `FileUploadIntentDto` |
| Upload completion | `POST /files/:fileId/complete` | Session + CSRF | — | `UploadedFileDto` only after validation/scan policy |
| Notifications | `GET /notifications` | Session | — | `NotificationDto[]` |
| Notification | `PATCH /notifications/:id/read` | Session + CSRF, `If-Match` | — | Updated `NotificationDto` |
| Notifications | `POST /notifications/read-all` | Session + CSRF, `Idempotency-Key` | — | `204` |
| Support | `GET /support/cases` | Session | — | `SupportCaseDto[]` |
| Support | `POST /support/cases` | Session + CSRF, `Idempotency-Key` | Category, subject, detail, attachment file ID | Created `SupportCaseDto` |
| Returns | `GET /returns` | Session | — | `ReturnRequestDto[]` |
| Return | `POST /returns` | Session + CSRF, `Idempotency-Key` | Shipment ID, reason, handover, idempotency key | Created `ReturnRequestDto` |
| Pickup | `GET /pickups/current` | Session | — | Current `PickupDto` or `null` |
| Pickup | `POST /pickups` | Session + CSRF, `Idempotency-Key` | Shipment ID optional, date, time, idempotency key | Created `PickupDto` |
| Pickup cancel | `POST /pickups/:id/cancel` | Session + CSRF, `If-Match`, `Idempotency-Key` | — | Updated `PickupDto` |
| Security sessions | `GET /security/sessions` | Session | — | `SessionActivityDto[]` |
| Trust device | `PATCH /security/sessions/:id/trust` | Session + CSRF, `If-Match` | `{ trusted: boolean }` | Updated `SessionActivityDto` |
| Revoke device | `DELETE /security/sessions/:id` | Session + CSRF, `If-Match`, `Idempotency-Key` | — | `204` |

### 5.2 Exact schema requirements

The backend must make its generated OpenAPI schemas and runtime responses match `client/src/api/contracts.ts`. The table below is a concise field-level implementation index. `Money` is always `{ currency: string[3], amountMinor: non-negative integer }`; do not return floating-point monetary amounts.

| DTO | Required fields |
|---|---|
| `AuthUser` | `id`, `firstName`, `lastName`, `email`, `phone`, optional `avatar`, `provider: password|google`, `verified` |
| `ShipmentDto` | `id`, `customerId`, `trackingNumber`, `carrier`, `transportMode: air|sea`, `packageName`, `origin`, `destination`, `etaAt`, `etaLabel`, `status`, `statusLabel`, `price`, optional `imageUrl`, `progress: 0..100`, `events[]`, optional `nextAction`, `allowedActions[]`, `revision` |
| `TrackingEvent` | `id`, `label`, `detail`, nullable `occurredAt`, `displayTime`, optional `complete`, optional `current` |
| `InvoiceDto` | `id`, `customerId`, `invoiceNumber`, nullable `shipmentId`, `shipmentLabel`, `route`, issue/due timestamps and labels, `status`, `total`, `lineItems[]`, optional `paymentMethod`, nullable `paidAt`, optional `paidAtLabel`, `revision` |
| `WalletDto` | `id`, `customerId`, `currency`, `availableBalance`, `pendingBalance`, `status: active|restricted|closed`, `updatedAt`, `revision` |
| `AddressDto` | `id`, `customerId`, `label`, `line`, `landmark`, `isDefault`, `revision` |
| `RecipientDto` | `id`, `customerId`, `name`, `location`, `phone`, `initials`, `revision` |
| Reference data | `offices[]` (`id`, `name`, `address`, `detail`), delivery options (`id`, `name`, `detail`, `eta`, `price`, optional `recommended`), transport options (`id: air|sea`, `name`, `detail`, `eta`) |
| `PaymentIntentDto` | `id`, `status: requires_action|processing|succeeded|failed`, optional `providerReference`, optional provider-safe `clientToken`, `revision` |
| `UploadedFileDto` | `fileId`, short-lived/authorized `url`, `contentType`, `sizeBytes` |
| `NotificationDto` | `id`, `customerId`, `type: progress|arrival|exception|payment`, `title`, `body`, `occurredAt`, `displayTime`, nullable `shipmentId`, `unread`, `revision` |
| `SupportCaseDto` | `id`, `customerId`, `category`, `subject`, `detail`, `status: open|in_review|resolved`, `createdAt`, `displayCreatedAt`, nullable `attachmentFileId`, `revision` |
| `ReturnRequestDto` | `id`, `customerId`, `shipmentId`, `trackingNumber`, `reason`, `handover: pickup|drop_off`, `status`, `displayStatus`, `createdAt`, `revision` |
| `PickupDto` | `id`, `customerId`, nullable `shipmentId`, `status`, `collectionPoint`, nullable `scheduledDate`, nullable `scheduledTime`, `revision` |
| `SessionActivityDto` | `id`, `customerId`, `device`, `location`, `lastActiveAt`, `displayLastActiveAt`, `current`, `trusted`, `revision` |

### 5.3 Required API additions for complete operational workflows

The endpoints in Section 5.1 make the existing adapter live. The following resources are required to complete workflows that are currently UI/local-state only. Backend engineers should build them now; frontend engineers will add the corresponding typed port methods and hooks in a coordinated follow-up. Do not misuse shipment actions or client storage as a substitute.

| Capability | Proposed endpoints | Required behavior |
|---|---|---|
| Server shipment drafts | `GET/POST /shipment-drafts`, `GET/PUT/DELETE /shipment-drafts/:id`, `POST /shipment-drafts/:id/submit` | Persist wizard data, cargo items, attached completed file IDs, recipient choice, delivery choice, quote reference, revision, expiry, and status. Submission revalidates all data and atomically creates the shipment/request; it is idempotent. |
| Shipment request creation | `POST /shipments` | Alternative/direct path for validated final submission. Calculates server price/eligibility; accepts completed file IDs only; returns shipment plus any initial invoice/payment requirement. |
| Quotes | `POST /quotes`, `GET /quotes/:id`, optional `POST /quotes/:id/accept` | Snapshot origin, destination, cargo, transport, delivery option, currency, amount, assumptions, expiry, and `revision`. Expired quote cannot be used without recalculation. |
| Delivery management | `GET/PATCH /shipments/:id/delivery` | Delivery instructions, approved recipient/address changes, depot collection choice, delivery-slot change. Server permits only statuses/business conditions allowed by operations. |
| Proof of delivery | `GET /shipments/:id/proof-of-delivery` | Customer-safe recipient name, timestamp, method (OTP/signature/photo), and short-lived authorized evidence URLs. |
| Invoice documents | `GET /invoices/:id/document`, `GET /invoices/:id/receipt` | Generate or serve authorized invoice/receipt PDF. Receipt exists only after verified settlement. Never rely on client-generated financial documents. |
| Payment methods | `GET /payment-methods`, `POST /payment-methods/setup-intents`, `DELETE /payment-methods/:id`, `PATCH /payment-methods/:id/default` | Store provider tokens/references only. Never send raw card data through this API unless the chosen PCI-compliant gateway explicitly requires it. |
| Payment status | `GET /payments/intents/:id`, `POST /payments/webhooks/:provider` | Customer can poll safe intent status; provider webhook validates signature, deduplicates events, journals raw event reference, and updates invoice/wallet transactionally. |
| Wallet history | `GET /wallet/transactions` | Expose customer-safe ledger display entries with type, money, status, timestamp, related invoice/payment/return references, and cursor paging. |
| Notification preferences | `GET/PATCH /notification-preferences` | Persist customer channel/category choices; verify recipient contact before enabling channels. |
| Support detail/messages | `GET /support/cases/:id`, `POST /support/cases/:id/messages` | Customer-visible case thread, staff/customer roles, file links only after scan, status history, and no internal notes. |
| Return detail/actions | `GET /returns/:id`, `POST /returns/:id/cancel` | Show eligibility outcome, address/pickup/drop-off detail, timeline, and permitted cancellation before handover. |
| Dashboard summary | `GET /dashboard/summary` | Optional performance endpoint returning customer-safe counts, next delivery, outstanding total, and wallet balance from one snapshot. It must not replace detail resources. |

## 6. Workflow Definitions and Server State Rules

### 6.1 Account, verification, and session workflow

Registration creates a customer in an **unverified** state, creates a time-limited verification challenge, and may establish a restricted session only if the business allows it. `POST /auth/verify` verifies the code, marks the chosen contact verified, and upgrades access. Login accepts email or phone as `identifier`, returns `ACCOUNT_DISABLED`, `CONTACT_UNVERIFIED`, or `401` as applicable, and sets the session/CSRF cookies. OTP resend and failed verification attempts must be rate-limited and audited.

Profile contact changes should follow a **pending-contact** model: retain the existing verified contact, send a challenge to the proposed new contact, and only promote it after verification. Current-password verification is mandatory before changing the password; an account deletion request should require recent authentication, create an audit record, revoke all sessions, and follow the agreed data-retention policy rather than blindly deleting financially required records.

### 6.2 Shipment request, quote, and draft workflow

The customer starts with an origin office or collection point, destination, recipient, transport mode (air or sea), delivery option (home delivery or office/depot collection), cargo lines, descriptions, and evidence such as delivery/debit notes. The server supplies office and option data, calculates quotes from authoritative rules, and validates all submitted line items.

```text
local draft (browser only)
  → optional server draft
  → quote calculated (expires)
  → files uploaded and scan-completed
  → shipment request submitted atomically
  → invoice/deposit requirement created if applicable
  → payment intent created
  → verified payment webhook settles payment
  → shipment accepted / pickup scheduled
```

The backend must not accept a filename, browser object URL, raw `price`, raw `allowedActions`, client `customerId`, or client-declared payment success. It accepts only validated values, completed file IDs owned by the session customer, and quote references that are current and compatible with the submitted data.

### 6.3 Shipment lifecycle and action authorization

The portal displays these shipment statuses. Operations may have additional internal substates, but the API returns only customer-safe states and timeline data.

| Status | Meaning | Customer-visible actions that may be allowed |
|---|---|---|
| `pending` | Request recorded; awaiting acceptance, information, pickup, or payment rule. | `pay`, `cancel`, `duplicate`, `schedule_pickup`, `report_issue` |
| `pickup_scheduled` | Collection date/time confirmed. | `reschedule_pickup`, `cancel_pickup`, `report_issue` |
| `picked_up` | Cargo collected at supplier/customer/office. | `report_issue` |
| `in_transit` | Cargo is moving between origin, hub, destination, or country. | `report_issue` |
| `at_destination` | Cargo reached destination warehouse/depot. | `pay` if eligible, `edit_delivery`, `reschedule_delivery`, `collect_from_depot`, `report_issue` |
| `out_for_delivery` | Last-mile delivery is underway. | `report_issue` only unless operations approve an exception |
| `delivered` | Delivery/POD complete. | `duplicate`, `report_issue`, eligible return request |
| `delayed` | Operations marked an exception/delay. | `report_issue`, possible delivery update as decided by operations |
| `failed` | Pickup/delivery/transport failure requiring resolution. | `reschedule_pickup`, `edit_delivery`, `collect_from_depot`, `report_issue` when business rules permit |
| `cancelled` | Shipment cancelled before an irreversible cutoff. | `duplicate`, possible refund visibility |

`allowedActions` is a response field calculated on the server for the exact session customer and current shipment state. `POST /shipments/:id/actions` must reject commands not present in the current server-calculated set with `409 INVALID_STATE_TRANSITION` or `422 ACTION_NOT_ALLOWED`; it must never trust the client’s prior copy of `allowedActions`.

### 6.4 Invoice, payment, receipt, refund, and wallet workflow

```text
invoice unpaid
  → create payment intent (idempotent)
  → requires_action / processing
  → customer completes provider flow outside or inside approved provider component
  → provider sends signed webhook
  → webhook verified and deduplicated
  → ledger entry + payment transaction committed
  → invoice paid or failed/refunded
  → receipt becomes available when paid
  → invoices, wallet, and dashboard refresh
```

The `POST /payments/intents` response means only that an attempt was created. It does **not** prove settlement. A webhook processing transaction must validate the provider signature, confirm the provider event identifier is new, resolve the intended invoice/customer/amount/currency, create an immutable financial event, update invoice state, append a wallet ledger entry when relevant, and publish notifications through an outbox. Duplicate or out-of-order provider webhooks must be safe.

Wallet rules are explicit: each customer has one wallet, its balance is the sum of immutable ledger entries, pending funds are distinct from available funds, and the frontend has no endpoint to alter balances. Refunds create compensating ledger entries only after the approved financial/refund process; they do not mutate prior history.

### 6.5 File workflow

The file endpoint first receives declared filename, MIME type, size, purpose, and idempotency key. It validates allowed purpose and size before returning a short-lived object-storage `uploadUrl`, required headers, `fileId`, and expiry. The browser uploads directly to private storage, then calls completion. Completion must verify object metadata/checksum where supported, run malware scanning, validate detected MIME type and size, and return a customer-authorized URL only after the scan policy permits access.

| File purpose | Permitted association after completion | Minimum safeguards |
|---|---|---|
| `shipment-evidence` | Shipment draft/request | Images/PDF/documents per policy, declared and detected MIME validation, 20 MB transport maximum unless approved otherwise. |
| `support-attachment` | Support case/message | Scan before staff/customer access; private URL. |
| `proof-of-delivery` | Shipment POD | Operations/provider-originated where applicable; immutable association and access audit. |
| `profile-photo` | Customer profile | Image-only, frontend currently limits to 5 MB; backend must enforce its own equal-or-stricter rule. |

### 6.6 Support, returns, pickup, notifications, and security sessions

A support case is created with category, subject, detail, and an optional **completed** attachment file ID. Staff changing case status creates a customer notification. A return request validates shipment ownership and eligibility before it enters `requested`; staff approval moves it to `approved`, then `in_transit` and `completed`, or `rejected` with a customer-safe explanation.

Pickup scheduling validates date/time zone, capacity, collection point, shipment eligibility, and cutoff. Cancellation/rescheduling preserves an audit trail. Notification read state changes are customer-owned; notification generation itself belongs to back-office events and must use an outbox to avoid lost notifications. Security-session listings expose device, coarse location, last active timestamp, current-session flag, and trust state; revoking a session immediately blocks it.

## 7. Authorization Matrix

| Resource/action | Customer session | Operations staff | System/webhook worker |
|---|---|---|---|
| View own profile, shipment, invoice, wallet, address, recipient, notification, support, return, pickup | Allowed only for owned customer records | Allowed only through explicit staff permissions and audited tooling | Not applicable |
| Create/update own address, recipient, profile, notification read state | Allowed with CSRF and revision where required | Support override only if separately authorized/audited | Not applicable |
| Create draft, quote request, shipment request, support case, return, pickup, payment intent | Allowed only for self | May create/change through operational workflow | Only trusted service account paths |
| Change shipment operational status, calculate official price, set `allowedActions`, issue invoice, write wallet ledger | Not allowed | Allowed only under granular operational roles | Allowed only in controlled job/webhook handlers |
| Settle payment, refund, issue receipt | Not allowed | Limited finance role/actions | Verified payment webhook or controlled finance service |
| Associate/view private uploaded file | Own authorized links only | Role/purpose constrained and audited | Scanner/object-storage worker only |
| Public tracking | Not required; public-safe subset only | Not applicable | Not applicable |

Use least-privilege roles such as `customer`, `operations_agent`, `operations_manager`, `finance`, `support_agent`, `security_admin`, and `system_worker`. The customer portal must never receive staff-only notes, provider secrets, raw payment credentials, full audit data, internal route cost calculations, or data belonging to another customer.

## 8. Security, Privacy, and Operational Requirements

| Area | Mandatory backend requirement |
|---|---|
| Transport | HTTPS only, modern TLS, HSTS at the edge, redirect/no service on plaintext HTTP. |
| Passwords | Use a modern adaptive salted password hash; enforce configurable password policy; rate-limit login/reset/verification; never log passwords, OTPs, or reset tokens. |
| Session | Opaque random server-side session IDs or securely validated signed tokens; rotate at login/privilege change; server-side revocation and short idle/absolute expiry; secure cookie attributes. |
| CSRF and CORS | Match origin policy, verified CSRF token on unsafe cookie-authenticated requests, explicit CORS allowlist, credentials only for approved origins. |
| Input validation | Validate all request schemas server-side, reject unknown/unsafe fields, use database constraints, parameterized queries/ORM, size limits, and safe error messages. |
| Object-level authorization | Query by `id AND customer_id` (or equivalent policy) for every customer-owned resource. Never load by ID then perform an optional ownership check. |
| Workflow security | Implement each lifecycle as a server-side finite-state machine. Reject out-of-order commands even if a caller is authenticated.[2] |
| Payments | Use gateway tokenization/hosted fields; verify webhook signatures and event IDs; store provider references, not card PAN/CVV; reconcile transactions. |
| Files | Private buckets, signed URLs with short expiry, content inspection, malware scan, type/size enforcement, no executable delivery, authorized downloads only. |
| Secrets | Keep provider keys, signing keys, database credentials, and webhook secrets in a secret manager. Rotate regularly; never expose them in responses, logs, browser variables, or source control. |
| Auditability | Capture actor, role, customer scope, request ID, action, resource type/ID, before/after safe summary, IP/user agent, timestamp, and result for high-risk actions. |
| Privacy | Establish data classification, retention/deletion schedules, access review, encrypted backups, and a legally approved customer data/export/deletion process. |

## 9. Health, Observability, and Deployment

The frontend’s `/healthz` is a static liveness document only. It does not test database, cache, payment, object storage, or the real API. The backend must separately expose:

| Endpoint | Requirement | Success criteria |
|---|---|---|
| `GET /healthz` | Unauthenticated process liveness. No database call required. | `200` when the API process can accept traffic. |
| `GET /readyz` | Dependency-aware readiness for deployment/load balancer. Keep response safe and minimal. | `200` only when required dependencies and migrations are usable; `503` otherwise. |
| `GET /metrics` | Private/secured metrics endpoint or agent export. | Latency, error rate, request count, queue/outbox depth, payment webhook failure, scan outcome, database/connectivity, and job metrics. |

Structured logs must include `requestId`, route, method, status, latency, authenticated actor/customer identifier in a privacy-safe form, error code, dependency name, and deployment version. Configure alerts for sustained `5xx`, elevated `401/403/429`, payment webhook failures, scan queue failures, readiness failures, idempotency conflict spikes, job backlog, and audit-log delivery failure. Do not log raw tokens, passwords, OTPs, card data, or full uploaded contents.

Deploy database migrations as a controlled, reversible process. Use expand/contract migrations, backup verification, migration locking, a staging rehearsal, and backward compatibility during rolling releases. API versioning must remain under `/api/v1`; breaking DTO changes require `/api/v2` or a coordinated versioned rollout.

## 10. Backend Delivery Sequence

| Stage | Backend work | Exit gate |
|---|---|---|
| 0. Foundations | Database schema, migrations, customer/session identity, role middleware, response envelope, request IDs, OpenAPI repo, CI, health/readiness, structured logging. | Migration rehearsal and base service security tests pass. |
| 1. Core customer reads | Session/auth/profile, reference data, shipments, shipment detail/public tracking, invoices, wallet. | DTO/OpenAPI contract tests and cross-customer denial tests pass. |
| 2. Settings and service workflows | Addresses, recipients, notification read state, support, returns, pickups, session security. | CRUD/revision/idempotency tests and customer smoke flows pass. |
| 3. Operational shipment completion | Server drafts, quotes, final shipment submission, delivery instructions, POD, invoice/receipt documents, file safety. | Full send-shipment workflow works against staging without browser persistence being authoritative. |
| 4. Financial completion | Payment intents, provider integration, webhook verifier, reconciliation, wallet ledger history, refunds. | Replay, fake webhook, duplicate intent, settlement, failure, and refund tests pass. |
| 5. Hardening and go-live | Load/security review, backups/restore exercise, observability alerts, incident runbook, production smoke, data-mode release. | All Section 11 gates are signed off. |

## 11. Required QA, Contract, and Acceptance Tests

The backend team must deliver automated tests, not only manual API checks.

| Test group | Required scenarios |
|---|---|
| Contract | Every endpoint validates against committed OpenAPI and frontend Zod DTO fixtures. Additive fields are allowed; missing/renamed/type-changed required fields fail CI. |
| Authentication | Valid login; wrong password; disabled user; unverified contact; expired/locked OTP; logout; session expiry; password change with wrong/current/new password paths; account deletion recent-auth guard. |
| Customer isolation | Customer A cannot read, update, delete, pay, download, mark read, or act on Customer B’s shipment, invoice, wallet, address, recipient, file, case, return, pickup, or session. |
| Concurrency | Stale `If-Match` returns `409`; default-address race leaves exactly one default; shipment state race remains valid. |
| Idempotency | Replay each protected create/action with same key returns original effect; same key/different payload conflicts; payment, shipment submission, upload intent, return, pickup, support case, and notification bulk-read have no duplicates. |
| Workflow order | Payment cannot settle from client call; cancelled/delivered shipment actions obey rules; expired quote cannot be submitted; file cannot attach before completion/scan; return eligibility enforced. |
| Payments | Invalid/unsigned webhook rejected; duplicate/out-of-order webhook safe; amount/currency mismatch quarantined; invoice/wallet/receipt only reflect verified provider settlement. |
| Files | Wrong owner/purpose blocked; oversized/disallowed MIME rejected; expired signed URL unusable; malware/scan-pending files inaccessible; authorized URL expires. |
| Resilience | Database/payment/storage failures return safe errors and request ID; `/healthz` and `/readyz` semantics work during dependency failure; outbox retry is safe. |
| Public tracking | Valid tracking gives only public fields; unknown tracking has safe response; rate limits and abuse controls return `429` + `Retry-After`. |
| Staging E2E | Register/verify/login; customer-specific dashboard; address/recipient CRUD; shipment tracking; draft→quote→upload→submit; payment pending/success/failure; invoice/receipt; support/return/pickup; logout/revoked session. |

### 11.1 Production switch checklist

The frontend configuration may switch to `VITE_NWC_DATA_MODE=http` only when all conditions below are true.

1. The API base URL uses HTTPS and responds under `/api/v1` with the required envelope.
2. The exported OpenAPI contract and endpoint fixtures validate against the frontend DTOs.
3. Customer isolation, CSRF, session cookie, revision, and idempotency test suites pass in staging.
4. Payment is webhook-confirmed, file uploads are scanned, and no raw financial credentials or server-authoritative data are placed in browser storage.
5. `/healthz`, `/readyz`, request-ID logs, alerts, migrations, backup/restore, and rollback runbook are tested.
6. A real staging account has completed the end-to-end acceptance flows above with expected frontend cache refresh and feedback states.
7. The production rollout keeps a rapid rollback path: revert the frontend data-mode deployment or point it to a safe prior API version while investigating an incident.

## 12. Business Decisions Still Needed Before Build Completion

The API should not guess these policies. Product/operations/finance must decide and record them, then backend tests must encode them.

| Decision | Required owner | Why it matters |
|---|---|---|
| Countries, currencies, office catalog, pickup/delivery service areas, transport lead times, cutoff times | Operations | Drives reference data, quotes, ETA, capacity, and validation. |
| Official pricing, taxes, deposits, payment deadlines, cancellation/refund fees, wallet use | Finance and operations | Determines quote, invoice, ledger, refund, and payment eligibility rules. |
| When a customer may cancel, change recipient/address, reschedule, or collect from depot | Operations | Determines server-calculated `allowedActions` and state transitions. |
| Payment providers and required mobile-money/card rails | Finance/engineering | Determines intent API payload, client token/redirect handling, webhook verification, reconciliation, and PCI boundary. |
| File types, size limits, scanner, retention, and whether customer evidence is visible to operations immediately | Security/operations | Determines upload policy and customer/staff access. |
| Contact verification channels and regional SMS/email provider | Product/security | Determines OTP generation, deliverability, retention, and fraud/rate-limit controls. |
| Privacy/retention/deletion policy and required legal documents | Legal/privacy | Determines account deletion behavior, audit retention, data exports, and consent records. |
| Staff roles and back-office system integration | Operations/engineering | Determines staff authorization, shipment event ingestion, notifications, and traceability. |

## 13. Handoff Artifacts Required From the Backend Team

Before frontend activation, provide the following artifacts to the project team.

| Artifact | Minimum content |
|---|---|
| OpenAPI 3.1 document | All Section 5 endpoints, schemas, error codes, cookie/CSRF security scheme, examples, rate-limit details, and version. |
| Staging base URL and test account method | Safe test tenant/customer setup; no production secrets in the frontend. |
| Contract-test report | Results proving all DTOs/envelopes match frontend contracts. |
| Authorization-test report | Cross-customer/object-level authorization results for every owned resource. |
| Payment integration note | Provider, client handoff method, webhook URL, signature approach, test event process, reconciliation and refund behavior. |
| File security note | Object storage provider, signed URL TTL, scanner, MIME/size policy, failure handling, retention. |
| Runbook | Deploy/rollback, migrations, incident contacts, alert response, service dependencies, health/readiness behavior. |
| Data mapping | How operational tracking, offices, rates, invoices, and pickup data enter this service and how event ordering/duplicates are handled. |

## 14. Final Integration Statement

The frontend can immediately consume the APIs in Section 5.1 once they conform to this document. The enhanced workflows in Section 5.3 must be implemented by the backend and then connected through the same existing adapter/query pattern; they do not require a customer-page redesign. This is the intended “plug-in” boundary: the backend owns truth, authorization, business rules, persistence, status transitions, financial settlement, external callbacks, and observability; the frontend owns presentation, form interaction, local unsent work, caching, and customer feedback.

## References

[1]: https://learn.openapis.org/specification/security.html "OpenAPI Learning: Describing API Security"
[2]: https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html "OWASP REST Security Cheat Sheet"
