# Customer API implementation checklist

Date: August 27, 2026

This checklist maps the React customer app API contract to the current Laravel admin API on `https://admin.newworldcargo.com/api`.

Current reality:

- The customer app now points its shared API client at `https://admin.newworldcargo.com/api`
- Only public tracking has a compatible customer-facing endpoint today
- Password reset is handled by redirect/handoff to Laravel web auth pages, not by customer API endpoints
- Most authenticated customer app features still need backend implementation

## Current admin API coverage

Currently present in Laravel `routes/api.php`:

- `GET /api/v1/public/tracking/{tracking_number}`
- `GET /api/search-shipments`
- `POST /api/submit-shipments`
- `GET /api/search-consignments`
- `POST /api/consignments/{consignmentId}/remove-shipment/{shipmentId}`
- `GET /api/get-current-stage`
- `GET /api/consignments/all`
- `GET /api/consignments/{consignment_id}/shipments`
- `GET /api/consignments/{consignment_id}`
- `GET /api/parcels/{tracking_number}`
- `GET /api/parcels/status/{status}`
- `POST /api/parcels/updated-since`
- `POST /api/parcels/received-confirmation`
- `POST /api/parcels/dispatch-confirmation`
- `GET /api/invoices/{tracking_number}`
- `GET /api/customers/{customer_id}`
- `POST /api/parcels/flag`
- `POST /api/reconcile`
- `GET /api/consignments/latest`
- `POST /api/parcels/unsynced`
- `POST /api/mark-as-paid`
- `POST /api/refund-payment`

Present in Laravel web auth, but not as customer JSON API:

- `GET /login`
- `POST /login`
- `GET /forgot-password`
- `POST /forgot-password`
- `GET /reset-password/{token}`
- `POST /reset-password`
- `GET /verify-otp`
- `POST /verify-otp`
- `POST /resend-otp`

## Frontend contract expected by the React app

### P0: public access and auth

#### 1. Public tracking

- Frontend expects: `GET /api/v1/public/tracking/{trackingNumber}`
- Current status: implemented
- Needed action:
  - keep response shape stable against `shipmentDtoSchema`
  - return `404` or a consistent empty/not-found payload instead of ambiguous `{}` if possible

#### 2. Session bootstrap

- Frontend expects: `GET /api/v1/session`
- Used by:
  - `client/src/api/auth-gateway.ts`
  - `client/src/contexts/AuthContext.tsx`
- Current status: missing
- Required response shape:
  - authenticated: `AuthUser`
  - unauthenticated: `401`
- Backend work:
  - add session-authenticated JSON route
  - derive customer profile from logged-in Laravel user
  - include `id`, `firstName`, `lastName`, `email`, `phone`, `provider`, `verified`

#### 3. Login

- Frontend expects: `POST /api/v1/auth/login`
- Current status: missing as JSON API
- Current Laravel equivalent:
  - `POST /login` web form
- Backend work:
  - create JSON login endpoint
  - issue/session-bind Laravel auth cookie
  - return `AuthUser`
  - error mapping:
    - invalid credentials → `401 ACCOUNT_INVALID` or equivalent
    - disabled account → `403 ACCOUNT_DISABLED`
    - unverified contact → `403 CONTACT_UNVERIFIED`

#### 4. Register

- Frontend expects: `POST /api/v1/auth/register`
- Current status: missing
- Backend work:
  - create customer registration API
  - create customer user
  - trigger verification flow
  - return `AuthUser`
  - conflict response for existing account

#### 5. OTP verify

- Frontend expects: `POST /api/v1/auth/verify`
- Current Laravel equivalent:
  - `POST /verify-otp`
- Current status: missing as JSON API
- Backend work:
  - expose OTP verification as JSON endpoint
  - keep existing OTP storage/expiry logic
  - return structured errors:
    - `OTP_EXPIRED`
    - `OTP_ATTEMPTS_EXCEEDED`
    - `OTP_INCORRECT`

#### 6. OTP resend

- Frontend expects: `POST /api/v1/auth/verify/resend`
- Current Laravel equivalent:
  - `POST /resend-otp`
- Current status: missing as JSON API
- Backend work:
  - expose resend as JSON endpoint
  - rate-limit aggressively

#### 7. Logout

- Frontend expects: `POST /api/v1/auth/logout`
- Current Laravel equivalent:
  - `POST /logout`
- Current status: missing as JSON API
- Backend work:
  - destroy session
  - return `204` or `{ data: null }`

#### 8. Signed-in password verification

- Frontend expects: `POST /api/v1/auth/password/verify`
- Current status: missing
- Backend work:
  - verify current password for signed-in user
  - return `401 CURRENT_PASSWORD_INVALID` on failure

#### 9. Signed-in password change

- Frontend expects: `POST /api/v1/auth/password/change`
- Current status: missing
- Backend work:
  - verify current password
  - validate new password
  - save new password

#### 10. Reset password API

- Frontend originally expected: `POST /api/v1/auth/password/reset`
- Current status:
  - not needed immediately because app now hands off to Laravel web reset
- Recommendation:
  - optional
  - only build if you want a full SPA reset flow later

### P1: customer shipment and billing data

#### 11. Shipment list

- Frontend expects: `GET /api/v1/shipments?q=&status=`
- Current status: missing
- Possible source data:
  - shipment/parcels/consignment tables already exist
- Backend work:
  - filter shipments to authenticated customer only
  - map records into `shipmentDtoSchema`

#### 12. Shipment detail

- Frontend expects: `GET /api/v1/shipments/{id}`
- Current status: missing

#### 13. Shipment actions

- Frontend expects: `POST /api/v1/shipments/{id}/actions`
- Actions expected by UI:
  - `pay`
  - `cancel`
  - `duplicate`
  - `schedule_pickup`
  - `reschedule_pickup`
  - `cancel_pickup`
  - `edit_delivery`
  - `reschedule_delivery`
  - `collect_from_depot`
  - `report_issue`
- Current status: missing
- Recommendation:
  - do not implement as one giant action controller first
  - start with only actions currently used in UI flows

#### 14. Invoice list

- Frontend expects: `GET /api/v1/invoices`
- Current status: missing
- Current Laravel related route:
  - `GET /api/invoices/{tracking_number}`
- Gap:
  - frontend needs invoice collection by authenticated customer, not a single tracking lookup

#### 15. Invoice detail

- Frontend expects: `GET /api/v1/invoices/{id}`
- Current status: missing

#### 16. Wallet

- Frontend expects: `GET /api/v1/wallet`
- Current status: missing
- Recommendation:
  - if no real wallet exists, return `null` cleanly and keep UI tolerant

### P1: profile and address book

#### 17. Profile update

- Frontend expects: `PATCH /api/v1/profile`
- Current status: missing

#### 18. Profile delete

- Frontend expects: `DELETE /api/v1/profile`
- Current status: missing
- Recommendation:
  - soft-delete or request workflow preferred over hard delete

#### 19. Addresses

- Frontend expects:
  - `GET /api/v1/addresses`
  - `POST /api/v1/addresses`
  - `PUT /api/v1/addresses/{id}`
  - `DELETE /api/v1/addresses/{id}`
  - `PATCH /api/v1/addresses/{id}/default`
- Current status: missing

#### 20. Recipients

- Frontend expects:
  - `GET /api/v1/recipients`
  - `POST /api/v1/recipients`
  - `PUT /api/v1/recipients/{id}`
  - `DELETE /api/v1/recipients/{id}`
- Current status: missing

### P2: operational support flows

#### 21. Shipment drafts

- Frontend expects:
  - `GET /api/v1/shipment-drafts`
  - `POST /api/v1/shipment-drafts`
  - `DELETE /api/v1/shipment-drafts/{id}`
- Current status: missing

#### 22. Reference data

- Frontend expects: `GET /api/v1/reference-data`
- Current status: missing
- Response should include:
  - offices
  - delivery options
  - transport options

#### 23. Payment intents

- Frontend expects: `POST /api/v1/payments/intents`
- Current status: missing
- Current Laravel routes like `mark-as-paid` are admin-side operational actions, not customer payment intent creation

#### 24. File upload intents

- Frontend expects:
  - `POST /api/v1/files/upload-intents`
  - `POST /api/v1/files/{id}/complete`
- Current status: missing

#### 25. Notifications

- Frontend expects:
  - `GET /api/v1/notifications`
  - `PATCH /api/v1/notifications/{id}/read`
  - `POST /api/v1/notifications/read-all`
- Current status: missing

#### 26. Support cases

- Frontend expects:
  - `GET /api/v1/support/cases`
  - `POST /api/v1/support/cases`
- Current status: missing

#### 27. Return requests

- Frontend expects:
  - `GET /api/v1/returns`
  - `POST /api/v1/returns`
- Current status: missing

#### 28. Pickups

- Frontend expects:
  - `GET /api/v1/pickups/current`
  - `POST /api/v1/pickups`
  - `POST /api/v1/pickups/{id}/cancel`
- Current status: missing

#### 29. Session activity

- Frontend expects:
  - `GET /api/v1/security/sessions`
  - `PATCH /api/v1/security/sessions/{id}/trust`
  - `DELETE /api/v1/security/sessions/{id}`
- Current status: missing

## Recommended build order

### Phase 1: restore authentication and core read access

Build first:

1. `GET /api/v1/session`
2. `POST /api/v1/auth/login`
3. `POST /api/v1/auth/logout`
4. `POST /api/v1/auth/verify`
5. `POST /api/v1/auth/verify/resend`
6. `GET /api/v1/shipments`
7. `GET /api/v1/shipments/{id}`
8. `GET /api/v1/invoices`
9. `GET /api/v1/invoices/{id}`

This restores:

- sign in
- session persistence
- OTP verification
- shipment list/detail
- invoice screens

### Phase 2: restore customer settings and basic actions

10. `PATCH /api/v1/profile`
11. address CRUD
12. recipient CRUD
13. `POST /api/v1/auth/password/verify`
14. `POST /api/v1/auth/password/change`
15. `GET /api/v1/security/sessions`

### Phase 3: operational extras

16. notifications
17. pickups
18. support cases
19. returns
20. drafts
21. payment intents
22. upload intents
23. reference data
24. wallet

## Implementation notes

### Response shape

Match the frontend schemas in `client/src/api/contracts.ts`.

The most important ones are:

- `AuthUser`
- `ShipmentDto`
- `InvoiceDto`
- `AddressDto`
- `RecipientDto`
- `SessionActivityDto`

### Error shape

Return JSON in this shape:

```json
{
  "error": {
    "code": "SOME_CODE",
    "message": "Human readable message",
    "fieldErrors": {
      "email": ["The email field is required."]
    },
    "retryable": false
  },
  "requestId": "uuid-or-request-id"
}
```

### Auth/session model

The React app assumes cookie-backed auth, not bearer tokens.

So the Laravel API should:

- use session auth
- allow cross-subdomain cookie behavior only if needed
- handle CSRF correctly for browser mutations

### Immediate next backend target

If you want the fastest path to a usable customer app, implement these first:

- `GET /api/v1/session`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/verify`
- `POST /api/v1/auth/verify/resend`
- `GET /api/v1/shipments`
- `GET /api/v1/shipments/{id}`

Without those, the customer app cannot function beyond public tracking and password reset handoff.
