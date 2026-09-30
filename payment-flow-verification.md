# Reusable Payment Modal Verification

Invoices and shipment payment details reuse `PaymentModal`. It loads the invoice amount and available methods from Laravel through the same-origin gateway before accepting payment details. No payment keys or payment environment variables are required in the frontend.

Laravel owns invoice eligibility, currencies, collection amounts, provider credentials, idempotency, verified status, and receipts. The browser sends an invoice ID, payment method, contact/billing details, and idempotency key; it does not send an authoritative amount or mark invoices paid.

For eligible ZMW invoices, customers can use mobile money or card. USD invoices offer card only. Mobile money accepts a 10-digit Zambian number. Card checkout collects billing/contact information and follows a backend-validated hosted checkout URL. Card number, expiry, CVV, and PIN are never collected by this portal.

The modal resumes pending attempts, polls Laravel for confirmation, and blocks another submission after an ambiguous timeout. Paid-state callbacks run only after Laravel reports success. Disabled payments, partial bills and unsupported invoices show the backend's explanatory message.

`tests/lipila-checkout-uat.mjs` covers mobile money, card handoff, USD, unavailable checkout, timeout, resumed pending requests, failure, and review at mobile/desktop widths. Provider responses are intercepted for UAT: this does not certify a live card charge or live webhook delivery.

## Payment Entry Points

- Shipment details: `Pay now` prepares a missing invoice through `POST /shipments/{id}/payments/checkout`, using stored charges and branch currency. Preparing the invoice never contacts the payment provider. Retries reuse the invoice. Existing invoices open the same payment modal directly.
- Invoices: `Pay invoice` opens the shared modal. A pending request started on the shipment is resumed, not sent again. Outstanding totals are grouped by currency.
- Home and Settings: payment links lead to Invoices. Settings does not display an invented saved phone number or promise to remember a payment method.
- Bookings without confirmed pricing: continue to await their actual shipment/bill; no invented deposit or price is collected.
- Partial, refunded, conflicting legacy records and missing exchange rates remain subject to backend eligibility checks. This change does not enable online installments.

`tests/shipment-self-service-uat.mjs` covers invoice preparation failure/retry, close/reopen, invoice reuse and shipment-to-invoice pending-payment continuity at desktop/mobile widths. The payment history review included commits `3c500b5`, `8ea8238`, `4724cbc` and `182dcbc` plus the current payment entry points.
