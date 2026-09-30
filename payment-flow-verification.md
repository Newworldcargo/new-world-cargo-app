# Reusable Payment Modal Verification

Invoices and shipment payment details reuse `PaymentModal`. It loads the invoice amount and available methods from Laravel through the same-origin gateway before accepting payment details. No payment keys or payment environment variables are required in the frontend.

Laravel owns invoice eligibility, currencies, collection amounts, provider credentials, idempotency, verified status, and receipts. The browser sends an invoice ID, payment method, contact/billing details, and idempotency key; it does not send an authoritative amount or mark invoices paid.

For eligible ZMW invoices, customers can use mobile money or card. USD invoices offer card only. Mobile money accepts a 10-digit Zambian number. Card checkout collects billing/contact information and follows a backend-validated hosted checkout URL. Card number, expiry, CVV, and PIN are never collected by this portal.

The modal resumes pending attempts, polls Laravel for confirmation, and blocks another submission after an ambiguous timeout. Paid-state callbacks run only after Laravel reports success. Disabled payments, partial bills and unsupported invoices show the backend's explanatory message.

`tests/lipila-checkout-uat.mjs` covers mobile money, card handoff, USD, unavailable checkout, timeout, resumed pending requests, failure, and review at mobile/desktop widths. Provider responses are intercepted for UAT: this does not certify a live card charge or live webhook delivery.
