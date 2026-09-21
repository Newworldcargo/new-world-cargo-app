# Booking browser acceptance audit

This is an evidence log, not a full production sign-off.

## Environment and evidence

- Chromium driven through Playwright, local portal on port 5193.
- Desktop 1440 x 900 and phone viewport 390 x 900.
- `node scripts/booking-browser-audit.mjs` runs with controlled customer/API fixtures and deliberately failed Google loading.
- `UAT_LIVE_MAP=1 node scripts/booking-browser-audit.mjs` uses real Google Maps and Places network requests. Customer identity, offices, prices and booking responses remain fixtures.
- Screenshots and machine-readable results: `/tmp/nwc-booking-browser-audit` and `/tmp/nwc-booking-live-map-audit`.
- Correction: this server's `/etc/hosts` overrides `app.newworldcargo.com` to the wrong machine. That caused the certificate/404 observations. Public DNS resolves to Vercel, which returns HTTPS 200. Use a browser resolver override or curl `--resolve` for production checks here. Production headers revealed a CSP blocking Google Maps scripts; the policy is being verified separately against the production build.
- No live customer order or payment was created.

## Executed interaction coverage

For International, City-to-City, Local and Custom at both viewport sizes:

- Open the route screen and inspect two searchable location controls.
- Verify only one map is mounted.
- On phone, collapse and expand the booking form.
- Attempt Continue with empty locations and verify navigation is blocked.
- Type a location query, inspect results, select with Enter and verify the popup closes.
- Dismiss the popup with Escape.
- Continue, go Back, and verify selected addresses remain.
- Enter cargo, reject quantity zero, restore quantity one.
- Add a second cargo item and remove it.
- Fill sender/receiver contacts; select custom request type where relevant.
- Advance through collection preference for City-to-City.
- Reach review, capture screenshot, submit and verify the returned reference.
- Check exactly one submission request and no uncaught page errors.
- Check horizontal overflow on the confirmation screen.

Separate live Google checks exercise enabled zoom controls, rendered tile images, and live Places search/selection/clear for Levy Junction in Local. Screenshots show an actual Lusaka-Kitwe road route. These do not prove every map gesture or failure state.

## Fixes from this audit

- Replace international native dropdowns with searchable floating comboboxes.
- Reuse location search for Local and Custom; preserve office suggestions and Google results.
- Add listbox/option semantics, active option, keyboard selection, Escape and outside-focus dismissal.
- Catch failed place-detail lookups and show a recoverable error.
- Replace duplicate desktop/mobile map instances with one responsive layout.
- Make the phone drawer handle operate; place the map above the form so confirmation controls are not covered.
- Remove nested decorative form panels.
- Reject invalid named-item quantities and incomplete direct-review submissions; reject missing/past scheduled pickup dates.
- Guard simultaneous submission calls.
- Stabilize coordinate dependencies and fit selected locations rather than all worldwide offices.
- Remove fabricated straight road lines when Directions fails.
- Hide pin confirmation when Maps is unavailable; add map-load retry.
- Use the active From/To target for map clicks and GPS placement; report GPS failure.
- Correct unreadable map status/control colours affected by global light-theme CSS.

## Still required before release acceptance

### Production Maps policy regression

The production CSP originally had `script-src 'self'`, blocking the Google Maps loader. A built-app Playwright run with the old header reproduced disabled map controls. The corrected header allows `maps.googleapis.com` and `maps.gstatic.com`, plus Maps frames and blob workers. It does not add inline script or eval permission. A development runtime previously injected into built HTML is now limited to development commands. The audit runner can apply the actual `vercel.json` headers using `UAT_PRODUCTION_HEADERS=1 UAT_BASE_URL=http://localhost:5194 UAT_LIVE_MAP=1` against a production preview. It rejects CSP/Maps errors and checks loaded map images.

Use `UAT_PUBLIC_DNS_IP=<current-public-DNS-address> UAT_BASE_URL=https://app.newworldcargo.com UAT_LIVE_MAP=1` to test the deployed site while bypassing this machine's stale hosts entry. Do not use `UAT_PRODUCTION_HEADERS` for that run: the deployed headers must be tested unchanged. API fixtures still apply, so these runs do not establish live booking persistence.

| Area | Remaining evidence or implementation |
| --- | --- |
| Live submission | Authenticated submission for every service, reconcile request/reference with admin Online Bookings, then open its details. |
| Pricing variants | Air and Sea, every local vehicle, schedule edits, quote expiry, unsupported routes, request hash consistency. |
| Retries | Drop the response after server acceptance and verify retry cannot create a second booking; a click guard alone does not prove this. |
| Map selection | Explicit pending-versus-confirmed state in the form, editing an anchored pin, dragging, touch pinch, exact center-pin accuracy, stale geocoder response cancellation. |
| Map continuity | No camera reset after edits, resize or Back; retained camera/selection across reload and later stages. |
| International | Filter receiving offices to the labelled destination country; test international overview, long-distance arcs, dateline and street-level transitions. |
| Phone ergonomics | Physical Android/iOS keyboard, safe areas, landscape, small 320px screen, touch drag drawer, sticky actions and map visibility during long-form scrolling. |
| Accessibility | Screen-reader announcements, focus after validation/navigation, full tab-order audit, zoomed text and contrast across every state. |
| Recovery | Offline/reconnect, denied GPS, retry after script/geocoder/route/Places errors, session expiry during submission. |
| Drafts | Save/resume, refresh after edits, account changes, duplicate saved drafts after failed submission, preserving all optional metadata. |
| Cargo and contacts | Blank extra rows, large/decimal quantities, long text, phone formats, saved-recipient selection, optional supplier details. |
| Confirmation | Live request detail navigation and distinction between a pending booking and an accepted shipment. |

The mobile repository's `booking-flow-assessment.md` also identifies incomplete acceptance checks. Its features are a reference, not proof of correctness. Prioritize blocking errors and recovery before adding further visual map features.
