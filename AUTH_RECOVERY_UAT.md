# Customer account recovery UAT

Date: 2026-09-24

## Implemented scope

- Public `/recover-account` linked from login, registration and password recovery.
- A reachable email is required, including for customers whose historical accounts have no usable email.
- Email code confirmation creates an encrypted, pending ownership-review request. It does not create a customer, merge accounts, change credentials, or reveal shipment history.
- Existing shipment references are optional evidence, never authorization.
- Recovery review: admin `/customer-account-recovery`, permission `manage-clients`, linked from the customer list.
- Changing review status records an audit event but does not grant account access. Staff must independently establish ownership before any existing account-management action.
- Phone login matches normalized primary/secondary account and customer-profile contacts. Shared numbers, including stale staff records, do not select the first account.
- Legacy direct account claiming redirects to the new recovery workflow.
- Password recovery codes are separate from registration/verification codes, hashed, time-limited, attempt-limited and consumed on success. Password recovery uses saved email, not unverified historical phone contacts.
- Unverified customers can establish a verification session but cannot read shipments.

## Automated verification

- Laravel tests use an isolated SQLite database and fake mail, not real customers.
- Covered: shared-phone login refusal, case-insensitive email lookup, profile-only phone lookup, incorrect/expired claim codes, five-attempt limits, duplicate confirmation, encrypted storage, unchanged customer records, no automatic authentication, review permission denial, permitted review updates and audit, password-code purpose separation, password-reset attempt limits.
- Frontend type check and production build passed.
- Frontend unit and gateway tests passed; both gateway allow-lists include recovery POST routes and do not expose recovery data through GET.
- Playwright at 390px and 1440px: recovery links, form submission, email-code step, reload persistence, incorrect-code correction, successful review submission, reference display and no horizontal overflow. API responses were mocked; no live email or SMS was sent.

## Outstanding acceptance checks

- Live email delivery to an explicitly authorized test address has not been tested in this change.
- SMS delivery remains an independent provider/package issue; no claim of successful live SMS delivery.
- The review queue is not automatic account linking or approval. Staff review and any approved data reconciliation still require operational UAT.
- No historical customers or shipments were reassigned, and duplicate-account conflicts remain for review.
- This is not a pass certificate for every authentication scenario in the broader checklist (Google sign-in, all legacy sessions, and every mobile-app auth path need separate coverage).
