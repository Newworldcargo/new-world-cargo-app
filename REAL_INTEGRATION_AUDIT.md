# React Real-Integration Audit

## Scope

The React customer portal now defaults to the server-backed same-origin BFF. Mock mode is available only when `VITE_NWC_DATA_MODE=mock` is explicitly set for an isolated demo.

## Completed changes

The HTTP adapter now forwards invoice search queries to Laravel, and Laravel searches invoices by receipt number and shipment code. Shipment search remains server-side and now covers tracking code, recipient address, destination address, next destination, and consignment source/destination.

The React payment modal no longer uses a timer or simulated success. It sends a payment-intent request for a server invoice and only reports completion when the backend returns a succeeded intent. Missing invoice identifiers, provider errors, and requires-action states are reported without claiming that money was collected.

Shipment drafts now use Laravel's `/api/v1/shipment-drafts` API for listing, creating, resuming, and deleting drafts. The send-shipment page no longer invents a shipment reference or claims that a booking deposit was received; it saves a server draft and clearly states that operations must provide an official quote or invoice before payment.

## Validation

| Check | Result |
|---|---|
| React typecheck | Passed |
| React test suite | 22 files, 69 tests passed |
| React production build | Passed |
| Laravel portal PHP lint | Passed |
| Laravel feature branch | `d977794` |
| React local sandbox commit | `c1298b6` |
| Draft PR | https://github.com/Newworldcargo/Cargo-Mangr/pull/25 |

## Still required before production

The Laravel payment controller still requires a real payment provider adapter, signed webhook verification, reconciliation, and settlement before production payments can be enabled. Shipment submission and official quote calculation still require operations-approved business rules. Object storage and malware scanning must be configured for uploads. OTP delivery and browser cookie/CORS behavior require staging verification.

Some controls remain intentionally local presentation behavior, such as notification preference toggles, browser share/copy operations, and local form state. They do not claim to have changed a customer record. Any operation that would change a server record must be wired to the portal API or show an explicit unavailable/error state before production activation.
