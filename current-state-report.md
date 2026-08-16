# New World Cargo Customer App — Current State Report

**Audit date:** 16 August 2026  
**Audited checkpoint:** `2f43fda7`  
**Scope:** Current frontend implementation, route wiring, reusable components, static data, interaction handlers, tests, build configuration, and observed runtime state. This report describes what exists in the codebase today; it does not propose or implement a redesign.

> **Executive conclusion:** The application is a polished, mobile-first customer-facing prototype for shipment tracking, shipment creation, billing, notifications, support, account settings, and legal-information presentation. The visual system is substantially complete, but the product remains **frontend-only and mock-backed**. The largest gap is not page coverage; it is the absence of authenticated server data, shipment/payment APIs, persistence, error handling, and operational workflows behind the UI.

## 1. Executive Summary

New World Cargo is currently a signed-in customer dashboard prototype for a logistics and cargo-shipping business. It is designed around customers receiving or sending cargo through New World Cargo offices in China, Dubai, Zambia, and local destinations. The primary journey is: open the dashboard, inspect an upcoming shipment or balance, track an existing parcel, start a new shipment request, choose air or sea transport, select office collection or home delivery, review the request, and simulate a booking-deposit payment.

The application’s main navigation is deliberately compact. Desktop navigation contains Home, Send, Shipments, Invoices, and Settings in a left sidebar. Mobile navigation uses a fixed navy bottom bar with Home, Shipments, Send, Invoices, and Settings, with Send placed third on mobile and second on desktop. Header actions include notifications, a profile menu on larger screens, and Support on smaller screens. The sidebar also exposes Get a quote, Support, and Log out.

The core product capabilities currently present are dashboard summaries, shipment listing and filtering, shipment detail and timeline presentation, a five-step Send Shipment wizard, quote estimation, invoices and receipts, simulated online payments by mobile money or card, read/unread notification filtering, settings subsections, and draft-safe legal policy pages. The product feels visually coherent and mostly complete as a **prototype experience**, but functionally partial because nearly all business data and mutations are local or static.

| Dimension | Current assessment |
|---|---|
| Visual/UI coverage | Mostly complete for the intended customer prototype |
| Core customer journeys | Present as UI flows, with several local-only or toast-only actions |
| Real persistence | Not implemented for shipments, invoices, preferences, drafts, notifications, or payment results |
| Authentication | No active auth UI/provider wiring in the current frontend bootstrap; logout is a local navigation/toast action |
| Backend/API integration | Not implemented in the customer screens |
| Error/loading/offline handling | Minimal to absent |
| Production readiness | Not ready for real customer operations without backend and policy work |

## 2. Current App Structure

The live application is organized into the following areas:

| Area | What currently exists |
|---|---|
| Customer dashboard | Home dashboard with delivery, wallet, actions, open bookings, tracking, and shipment CTA sections |
| Shipment management | Shipment list, search/filter controls, shipment cards, detail view, status timeline, copy/share actions, reschedule modal for selected statuses |
| Shipment creation | Five-step Send Shipment wizard: Pickup, Recipient, Cargo, Transport, Review, then simulated payment and confirmation |
| Quote estimation | Local quote form with origin, destination, weight, package size, and delivery options |
| Billing | Invoice list with search/filter, invoice detail modal, generated invoice/receipt downloads, and simulated payment |
| Notifications | Unread/read tabs, notification cards, counts, shipment deep links, empty state |
| Support | Support modal with phone and email links, opened from sidebar/header |
| Settings | Settings hub with details, preferences/payments, and Legal groups; detail route switchboard |
| Legal | Legal hub and policy-detail routes with draft-safe policy content and status/version/effective-date presentation |
| Account | A legacy Account page remains in the source tree, but `/account` is routed to Settings and the legacy page is not a live primary route |
| Authentication | No login/registration screens are implemented in the current route table |
| Server/data layer | The repository contains a minimal server entry and a `users` Drizzle schema, but current customer pages do not call a backend API |

## 3. Complete Page and Route Inventory

### 3.1 Live routes

| Route | Page | Purpose and entry points | Main actions | Completeness | Mock/placeholder status |
|---|---|---|---|---|---|
| `/` | Home | Main dashboard; desktop Home nav, mobile Home nav, logo/back-home links | Start shipment, view next delivery, review payment, track package, open shipment list/detail, open quote, open support-related cards | Mostly complete | Static shipment, invoice, user, and action data; several cards use toast or local navigation |
| `/shipments` | Shipments | Shipment list; desktop/mobile Shipments nav, Home “All bookings”/shipment actions | Search, filter all/active/delivered, reset filters, open shipment detail, start shipment | Mostly complete | Directly reads mock `shipments`; no loading/error/pagination/sorting/API states |
| `/shipments/:id` | ShipmentDetail | Shipment summary and tracking view; shipment cards, tracking input, notification cards | Back to shipments, copy ID, share, reschedule where applicable, delivery instructions toast, timeline expansion/display, proof/receipt toasts | Partial / mostly complete UI | Unknown IDs fall back to first mock shipment; several actions are UI-only; no real tracking or delivery operations |
| `/send` | SendShipment | Five-step shipment-request wizard; Send nav, Home CTA, quote CTA, Settings address/recipient actions | Pickup office/address, recipient/contact, optional notes, cargo rows, evidence upload names, air/sea, office/home delivery, review, Back, Save as Draft, Continue, simulated booking deposit | Mostly complete UI | Inputs live in React state; draft uses localStorage; upload only records filenames; no server submission or payment gateway |
| `/quote` | Quote | Estimate screen; sidebar Get a quote, Home CTA | Set route/weight/package size, view delivery options, go to Send | Partial | Local estimate presentation; quote values/options are static and are not passed into Send |
| `/notifications` | Notifications | Notification inbox; header bell | Switch unread/read, open related shipment | Partial | Notification array is hardcoded in page; Mark all read is present but has no implemented state handler |
| `/invoices` | Invoices | Billing screen; desktop/mobile Invoices nav, Settings billing/payment methods, Home wallet actions | Search, all/unpaid/paid filter, open invoice detail, download invoice, download paid receipt, pay unpaid invoice | Mostly complete UI | Mock invoices; paid state exists only in component state; downloads are generated local text files; no gateway or backend mutation |
| `/settings` | Settings | Settings hub; Settings nav and profile menu | Open account, addresses, recipients, notifications, payment methods, security, billing, Legal | Mostly complete navigation hub | Links work, but destination pages are largely local/static |
| `/settings/:section` | SettingsDetail | Detail route switchboard for account/settings subsections | Account information view; address/recipient list actions; local notification toggles; billing/payment/security navigation | Partial | No edit forms, persistence, deletion, validation, API state, or settings error states |
| `/settings/legal` | Legal | Legal policy catalog; Settings Legal section | Open policy detail pages | Mostly complete content hub | Policy catalog is draft-safe and explicitly marked pending approval |
| `/settings/legal/:policy` | Legal | Individual policy detail | Back to Legal, read policy content | Partial / content-complete prototype | Privacy, Terms, Shipping, Returns & Refunds, Payment Terms, Acceptable Use/Customer Responsibilities are draft content; no acceptance tracking or jurisdiction binding |
| `/account` | Settings | Compatibility route; profile menu/legacy links | Opens Settings hub rather than legacy Account page | Possibly obsolete alias | Legacy `Account.tsx` exists but is not the rendered route |
| `/404` and unmatched routes | NotFound | Fallback | Return home / navigate back depending on implementation | Complete basic fallback | Static not-found content |

### 3.2 Major non-route views and overlays

| View | Location | Current behavior | Assessment |
|---|---|---|---|
| Support modal | `AppShell` | Phone and email links, close button, support copy | UI complete; no ticket/case workflow |
| Profile dropdown | `AppShell` desktop header | Profile → `/settings/account`, Settings → `/settings`, Log out → home/toast | Partial; no real profile/auth mutation |
| Payment modal | Shared component | Mobile money/card selection, local validation, remembered last method, simulated async confirmation | UI complete prototype; no provider integration or failure states |
| Invoice detail modal | `Invoices` | Shows invoice information and line items; download/pay actions | Mostly complete local UI |
| Reschedule delivery modal | `ShipmentDetail` | Hardcoded times for delayed/out-for-delivery cases | Partial; no mutation or availability source |
| Pickup office suggestion list | `SendShipment` | Filters office suggestions as the user types and supports keyboard selection | Complete UI; no geocoding or address validation |
| Toast notifications | Shared `sonner` usage | Confirms local actions such as saved draft, payment, copy, and placeholder actions | Useful prototype feedback, but often substitutes for real workflows |

## 4. Exact Navigation Map

### Desktop shell

`Home → /`  
`Send → /send`  
`Shipments → /shipments`  
`Invoices → /invoices`  
`Settings → /settings`  
`Get a quote → /quote`  
`Support → support modal`  
`Log out → / + signed-out toast`

### Mobile shell

`Home → /`  
`Shipments → /shipments`  
`Send → /send`  
`Invoices → /invoices`  
`Settings → /settings`

### Header and profile navigation

`Bell → /notifications`  
`Profile → /settings/account`  
`Settings in profile menu → /settings`  
`Log out in profile menu → / + signed-out toast`  
`Support icon on mobile → support modal`

### Main workflow links

`Home → Start a shipment → /send`  
`Home → Next delivery → /shipments/shipment-19034`  
`Home → Wallet/payment card → /account`, which resolves to Settings rather than a dedicated wallet page  
`Home → Manage order / Track another package → /shipments` or hardcoded shipment detail based on tracking input  
`Home → Quote → /quote`  
`Quote → Continue / Send → /send`  
`Shipments → shipment card → /shipments/:id`  
`Send success → Track cargo → /shipments/shipment-48291`  
`Settings → Billing/payment methods → /invoices`  
`Settings → addresses/recipients → /send`  
`Notifications → related shipment → /shipments/:id`  
`Legal hub → /settings/legal/:policy`

### Navigation concerns

The `/account` route is a compatibility alias to Settings while Home payment/card actions still navigate to `/account`; this creates a semantic mismatch between the label “wallet/payment” and the destination. Several routes are reachable only through specific links rather than primary navigation, including Quote, Notifications, and Legal. The legacy `Account.tsx` is not connected to the live route table. The app has no public tracking route, no login route, and no dedicated wallet route.

## 5. Current User Workflows

### Create shipment

`Home or Send → Pickup → Recipient → Cargo → Transport → Review → Payment modal → Success`

Pickup supports four New World Cargo office suggestions and free-text address entry. Recipient supports name, phone, and optional notes. Cargo supports two default rows, add/remove row controls, optional description, photo filenames, and debit/delivery-note filenames. Transport supports Air cargo and Sea cargo, plus office collection or home delivery with an explicit possible-extra-fee message. Review shows entered values and the booking deposit. The user can move backward through the wizard, save a draft to localStorage, continue forward, and reach a success state after the simulated payment.

Missing states are real validation, server-side save, upload transfer, payment failure, payment pending, network errors, and persistent draft recovery UI. The success state uses a fixed reference and links to a mock shipment.

### Quote estimation

`Home/sidebar → Quote → enter route/weight/package details → view Standard/Express/Same day cards → /send`

The visual estimate works locally, but the quote is not transferred into the Send wizard and there is no price calculation service, validation model, or quote expiration.

### Track shipment

`Home tracking input → hardcoded tracking match → /shipments/shipment-19034 or /shipments/shipment-48291`; alternatively `Shipments → shipment card → /shipments/:id`.

The tracking interface includes manual number input, Enter-key behavior, and a QR-scan UI action that currently produces a toast. Detail pages show status, ETA, route, timeline events, and action buttons. There is no public tracking, live carrier feed, map, delay update, proof-of-delivery object, or backend lookup.

### Pay an invoice

`Home wallet/payment or Settings → Invoices → unpaid invoice → PaymentModal → local success → invoice marked paid in component state`

The payment modal offers mobile money and ATM/debit card options. It remembers the last successful payment method in localStorage. The invoice page provides invoice and paid-receipt downloads as generated text files. There are no gateway calls, payment authorization, webhook reconciliation, failed payment screen, pending state, refund workflow, or durable receipt storage.

### Notification review

`Header bell → Notifications → Unread/Read tabs → related shipment detail`

Unread/read filtering and counts are present. Notification items deep-link to shipment details. Mark all read is visible but does not currently mutate the notification list.

### Settings management

`Settings → section → local detail view or navigation to existing screen`

The hub exposes account, addresses, recipients, notifications, payment methods, security, billing, and legal. Addresses and recipients can route into Send; notifications use local toggles; payment and billing link to Invoices; security shows information and routes back into account. There are no persistent settings mutations or account-management forms.

### Support

`Sidebar/header support → Support modal → Call or Email`

Phone and email links are implemented. There is no support ticket, case number, chat, attachment, WhatsApp action, or issue-status workflow.

## 6. Shipment Workflow Audit

| Capability | Current state | Evidence/notes |
|---|---|---|
| Create shipment | Partial / UI complete | Five-step wizard with local state and simulated payment |
| Save draft | Partial | Saves serialized state to `localStorage`; no Drafts page or reopen flow |
| Edit shipment | UI-only | User can move backward during creation; no post-creation edit route |
| Cancel shipment | Not found | No cancel action in list/detail/wizard |
| Delete draft | Not found | No draft list or delete action |
| Shipment details | Implemented as UI | `/shipments/:id` with summary and timeline |
| Tracking lookup | UI-only | Search/input and hardcoded routes, no API lookup |
| Shipment timeline | Implemented as static UI | Timeline renders mock events |
| Pickup scheduling | Not found | Pickup address is collected; no schedule/calendar workflow |
| Reschedule pickup | Not found | Only delivery reschedule UI exists |
| Delivery instructions | Partial / toast-only | Button gives informational toast; no saved instruction form |
| Change recipient | Not found | Recipient is collected only during creation |
| Change delivery address | Partial / creation-only | Address field exists for home delivery; no post-booking edit |
| Reschedule delivery | Partial / UI-only | Modal with hardcoded time choices; no mutation |
| Share tracking | Partial | Uses Web Share API when available, then toast; no share-link service |
| Proof of delivery | UI-only | Button/toast presentation, no document or image |
| Report problem | Not found | No report-issue workflow |
| Return shipment | Not found | Legal Returns policy exists, but no operational return flow |
| Send again / duplicate shipment | Not found | No duplicate action |

## 7. Implemented Shipment Lifecycle

The central `ShipmentStatus` type defines: `pending`, `pickup_scheduled`, `picked_up`, `in_transit`, `at_destination`, `out_for_delivery`, `delivered`, `delayed`, and `failed`.

The current mock records exercise only `in_transit`, `out_for_delivery`, and `delayed`. Timeline data also displays created, picked up, destination, delivery attempt, reschedule, and delivered labels. The lifecycle is therefore represented as:

`Shipment created → Picked up → In transit → At destination → Out for delivery → Delivered`

with alternate paths for:

`Delivery attempt → Reschedule delivery` and `Delayed` / `Failed` status badges.

The lifecycle is not centrally enforced as a state machine. Status labels, timeline labels, and status styles are distributed across static data and UI components. Several statuses are defined but not represented by current sample records. “Arriving today,” “Delayed,” “Action needed,” and “Current” are customer-facing labels layered on top of the underlying status values.

## 8. Authentication Audit

| Capability | Current state |
|---|---|
| Login | Missing from current route/bootstrap |
| Registration | Missing |
| Google or social auth | Missing |
| Forgot password | Missing |
| Reset password | Missing |
| OTP/email/phone verification | Missing |
| Change password | Settings row/presentation only |
| Security settings | Partial static presentation |
| Logout | UI-only navigation and toast; no visible session mutation |
| Session expiry | Missing |
| Active sessions | Missing |
| Account deletion | Missing |
| Protected routes | Not enforced in current client route table |
| Auth provider connection | Not used by current `main.tsx` bootstrap or page data flows |

The repository contains a Drizzle `users` schema and a minimal server entry, but the inspected customer UI does not have an active auth client, query client, protected-route guard, or API-backed user session flow.

## 9. Account and Profile Audit

The live Settings hub exposes account details, addresses, recipients, notification preferences, payment methods, security, billing, and legal. The account detail screen displays static profile/contact rows. It does not provide edit name, phone, email, profile picture, password, or account-deletion forms. Saved addresses and saved recipients are displayed from mock arrays; add/select actions route into Send rather than maintaining an address book. Notification preferences are local toggles. Payment methods describe the UI behavior and route to billing but do not manage stored methods.

The legacy `Account.tsx` contains an older account surface with profile, saved addresses, recipients, and preference/payment tiles, but `/account` currently resolves to `Settings`. This makes it a likely obsolete implementation that should not be treated as a second live account experience.

## 10. Payment Audit

The main payment surfaces are the shared PaymentModal, Invoices page, Home wallet/payment card, Settings payment-methods section, and the Send Shipment booking-deposit step.

The PaymentModal supports mobile money and card methods, remembers the last successful method through `localStorage`, performs local field validation, simulates asynchronous processing, and returns a confirmation callback. Invoices supports paid/unpaid filters, invoice detail, local downloads, receipt downloads for paid invoices, and a local paid-state update after simulated payment. The Send flow reuses the same modal for a K 320 booking deposit.

| Payment capability | Current state |
|---|---|
| Amount summary | Implemented in UI |
| Mobile money | UI-only simulated method |
| ATM/debit card | UI-only simulated method |
| Payment success | Local success callback |
| Payment failure | Missing beyond local validation |
| Pending state | Simulated delay only; no customer-facing pending state |
| Invoice list/detail | Mostly complete UI, mock-backed |
| Receipts | Generated local text-file download |
| Refund UI | Missing |
| Retry payment | Implicitly possible by reopening pay; no dedicated retry workflow |
| Gateway/tokenization | Missing |
| Webhooks/reconciliation | Missing |

## 11. Tracking Audit

Tracking is available to signed-in-looking dashboard surfaces, not as a public route. The Home page includes manual tracking input, Enter-key handling, a QR-scan action, and hardcoded matching to two sample shipments. The shipment list supports search by tracking number, package, or destination. Shipment detail shows tracking number, origin/destination, mode, status, ETA, timeline, shipment details, and actions.

There is no live tracking search service, map, public tracking page, real QR scanner, courier feed, proof-of-delivery record, shareable tracking URL, delay notification engine, failed-delivery workflow, or map-based courier location. Timeline and ETA are static mock values.

## 12. Notification Audit

Notifications are implemented in `Notifications.tsx` as a local hardcoded array. Each item has a category/type, icon, visual treatment, shipment ID, message, time, and unread flag. The page provides Unread and Read tabs with counts, shipment deep links, and an empty state for a filtered tab.

Mark all read is visible but has no working mutation. Individual read marking, server synchronization, preferences, categories beyond the local data shape, push notifications, offline state, and notification loading/error states are missing. Notification deep links can route to shipment details, but unknown shipment IDs fall back to the first mock shipment rather than showing a not-found state.

## 13. Support Audit

Support is a modal rather than a help-center route. It includes a phone link to `+260 763 297 287`, an email link to `info@newworldcargo.com`, a close button, and general shipment-support copy. It can be opened from the desktop sidebar and mobile header. The Home “Get help” and lower support prompt are primarily toast or navigation affordances rather than a complete support workflow.

There is no FAQ/help center, shipment-specific case form, report-issue form, support ticket, case status, attachment upload, chat, WhatsApp link, or support-history page. The displayed support details should be verified before production publication.

## 14. Address and Recipient Audit

### Addresses

The mock address set contains Home, Office, and China warehouse records. The Send wizard contains pickup-office suggestions for China, Zambia, Kitwe, and Dubai, plus free-text pickup and final delivery fields. Settings lists saved addresses and routes actions into Send.

View/list presentation exists. Add, edit, delete, default management, map/geocoding, landmark, and delivery-instruction persistence are missing or only represented as static fields/toasts. The office-suggestion list is a UI convenience rather than an address service.

### Recipients

The mock recipient set contains Jane Banda, Michael Phiri, and Kafue Office. Settings lists recipients and routes recipient actions into Send. The Send wizard collects recipient name, phone, and optional notes. View/list and creation-field presentation exist; edit, delete, search, recipient history, and persistent recipient selection are missing.

## 15. Reusable Component Audit

### Application components

| Component | Role |
|---|---|
| `AppShell` | Desktop sidebar, mobile bottom navigation, header, profile menu, support modal, logout action |
| `BrandMark` | Shared New World Cargo logo/brand mark presentation |
| `SubpageBackButton` | Shared yellow back-button pattern used on subpages |
| `ShipmentCard` | Main responsive shipment card for Home and Shipments |
| `CompactShipmentRow` | Compact shipment list row |
| `StatusBadge` | Shared status label and icon treatment |
| `CargoModeLabel` | Shared Air cargo / Sea cargo label |
| `Timeline` | Shipment event timeline |
| `ShipmentActions` | Copy, share, reschedule, delivery-instruction actions |
| `CargoRail` | Route/transport progress ribbon |
| `PaymentModal` | Reusable card/mobile-money payment UI for invoices and Send |
| `ErrorBoundary` | React rendering error boundary |
| `ManusDialog` | Existing dialog wrapper/presentation component |
| `Map` | Existing map integration component, not used by the audited customer workflows |

### UI primitives

The project includes a broad shadcn/Radix-style primitive set: accordion, alert-dialog, alert, aspect-ratio, avatar, badge, breadcrumb, button-group, button, calendar, card, carousel, chart, checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu, empty, field, form, hover-card, input-group, input, input-otp, item, kbd, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, spinner, switch, table, tabs, textarea, toggle-group, toggle, tooltip, and sonner.

Many primitives are installed/generated but the current customer pages frequently use direct `<button>`, `<input>`, `<textarea>`, and custom class strings instead of composing the full primitive library. This is not necessarily broken, but it creates opportunities for style and behavior drift.

### Duplication and componentization observations

The Send page is large and contains several inline helper components: `StepBlock`, `Field`, `PickupAddressField`, `EvidenceUpload`, `EvidenceList`, and `ChoiceCard`. The Settings detail page is a large route switchboard. Notifications keeps its item data and filtering logic inline. These choices are manageable for a prototype but will become costly as API loading, validation, permissions, and error states are added.

## 16. Design System Audit

The intended visual system is Poppins typography, white/light canvas, Cargo Yellow `#FFC83D` for primary actions and active emphasis, and navy `#012642` as the secondary brand color. The global CSS defines design tokens and a `.nwc-light` compatibility layer that remaps older dark-theme utility classes into light-mode equivalents. Bold text is normalized toward the navy brand color. Air cargo uses yellow treatments; Sea cargo uses navy surfaces and yellow/white contrast.

The interface uses rounded cards, rounded-2xl controls, larger rounded shipment surfaces, thin borders, low-shadow or no-shadow styling, Lucide icons, and responsive grid/flex layouts. Desktop uses a fixed 236px sidebar; mobile uses a fixed navy bottom navigation bar. The shared back-button convention is yellow.

The principal inconsistency is architectural rather than visual: several files still contain stale comments describing a dark command-center or lavender-accent system, while the actual rendered design has been normalized toward white, yellow, and navy. Many page classes still use `text-white/*`, `bg-white/*`, and `border-white/*`; the compatibility layer makes them render on the light theme, but it increases cognitive load and makes future palette work riskier. Status colors are intentionally limited, but some semantic distinctions are expressed through opacity rather than a centralized status token system.

## 17. Responsive Audit

### Mobile

The app has a genuine mobile-first shell: compact header, fixed navy bottom navigation, mobile-specific spacing, stacked cards, scrollable payment modal, and mobile-safe shipment-card grids. The Send wizard controls now stack correctly, with Back and Save as Draft on the left and Continue below/alongside according to width. Homepage delivery, wallet, shipment, and action cards have been adjusted to wrap inside narrow widths.

Remaining mobile risks are dense tables or modal-like content on future settings/payment additions, long policy text, and any future API error/loading surfaces. The current pages do not use a map or complex table as a primary mobile view. The fixed bottom navigation requires continued testing against device safe areas and keyboard-open states.

### Tablet

The layout uses responsive max widths and grid breakpoints, but tablet-specific composition is not a distinct design mode. The desktop sidebar appears at `lg`, so intermediate widths rely on the mobile shell until the breakpoint. This is functional but should be tested at common tablet widths.

### Desktop

Desktop intentionally uses a persistent left sidebar and wider grids. Home uses two-column top/content sections and a two-column shipment area; Shipments uses a two-column card grid. The Send wizard expands to a max-width content area. The design is generally intentional rather than a simple stretch, although many page-specific widths are embedded directly in class strings.

## 18. State Management Audit

| Feature | Current state owner |
|---|---|
| Navigation | Wouter URL/location state plus local open/closed modal/profile state |
| Home shipments/invoices | Imported static mock arrays |
| Shipments filters/search | Local React state in `Shipments` |
| Shipment detail selection | URL parameter, resolved against static `shipments` array |
| Send wizard | Local React state for step, form, cargo rows, evidence filenames, transport, handover, payment, success |
| Shipment draft | Explicit localStorage write under `new-world-cargo-draft`; no load/reopen UI |
| Invoices | Static mock array plus local state for filters, selected invoice, payment results, and paid methods |
| Payment method memory | localStorage key `nwc-last-payment-method` inside PaymentModal |
| Notifications | Hardcoded in-page array plus local selected tab; mark-all-read is incomplete |
| Settings notifications | Local toggle state only |
| Support/profile menus | Local React state |
| Auth/user | Static display values and shell navigation; no active data provider in current bootstrap |
| API/query state | No TanStack Query, Redux, Zustand, or service abstraction used by customer pages |

There is no shared server-data cache, normalized global state, API mutation layer, or centralized form store. This keeps the prototype understandable but means each major page will need integration refactoring before live data is introduced.

## 19. Form Audit

| Form | Fields | Validation/state | Success and missing states |
|---|---|---|---|
| Send — Pickup | Pickup office/address, location shortcut, saved-address shortcut | Local text state; office suggestions and keyboard selection; no required-field validation | Continues locally; no address validation, geocoding, error, or loading state |
| Send — Recipient | Name, phone, optional notes | Local text state; no schema validation | Continues locally; no phone verification or recipient persistence |
| Send — Cargo | Repeating name/quantity rows, optional description, photo/document file inputs | Local state; rows add/remove; file inputs store filenames only | Continues locally; no size/type upload errors, required cargo validation, or upload progress |
| Send — Transport | Air/Sea, office collection/home delivery, final address when needed | Local choice state; home-delivery fee warning | Continues locally; no service availability, exact quote, or fee calculation |
| Send — Review/payment | Review summary, payment method fields in modal | Local payment validation and simulated async delay | Local success; no failure/pending/network state or server confirmation |
| Quote | From, to, weight, package size | Local state; no visible schema/error state | Shows static delivery options; values do not transfer to Send |
| Shipment tracking | Tracking number | Minimal input/Enter handling | Hardcoded matching/navigation; no lookup error or loading state |
| Invoice search/filter | Search plus all/unpaid/paid filter | Local state | Empty result state; no API state |
| Settings toggles | Notification preference switches | Local state | Immediate local toggle; no persistence |

React Hook Form and centralized Zod schemas are installed or available in the dependency environment, but the audited forms use local React state and inline handlers instead of a shared form/validation architecture.

## 20. Mock Data Audit

The central mock source is [`client/src/lib/mock-data.ts`](client/src/lib/mock-data.ts). It defines three shipments, three addresses, four pickup office suggestions, three recipients, three quote delivery options, two cargo transport options, and four invoices. `client/src/lib/domain.ts` defines TypeScript shapes for Shipment, TrackingEvent, Address, Recipient, DeliveryOption, Invoice, and status unions.

Notifications are an exception: their data is hardcoded directly in `Notifications.tsx`. Home also contains page-specific presentation and hardcoded action text. The Send success reference and tracking lookup include fixed values. Payment and settings state are local. The data structures are reasonably shaped for a future API, especially shipments, timeline events, addresses, recipients, and invoices, but they lack server identifiers/relationships beyond simple strings, audit metadata, pagination, permissions, and mutation models.

| Area | Integration difficulty |
|---|---|
| Shipment cards/list/detail | Requires refactor around loading/error/query ownership, but domain types are a useful starting point |
| Invoice list/payment | Requires gateway and backend mutation boundaries before integration |
| Send wizard | Requires extraction of a request DTO, upload service, validation, draft endpoint, and payment orchestration |
| Settings | Requires backend resource models and form workflows |
| Notifications | Requires replacing in-file array with query data and read-state mutations |
| Legal | Easy to render from CMS/config, but requires approved content, versioning, jurisdiction, and acceptance tracking |
| Quote | Requires a quote service and a shared quote-to-shipment model |

## 21. API Integration Readiness

No customer-facing page currently calls an API abstraction. There is no visible tRPC client, query client, REST service module, mutation layer, repository, or typed API response model in the active frontend bootstrap. The server/schema footprint is not connected to the page workflows.

The strongest integration-ready portions are the static domain types and mock object shapes. Shipment and invoice IDs are present and consistent enough for initial API mapping. The weakest portions are the wizard, payment, notifications, settings, and quote flows because state and business logic are embedded directly in page components. Before API integration, the project needs clear service boundaries, request/response DTOs, server-owned status transitions, authenticated user context, loading/error conventions, and mutation invalidation rules.

## 22. Error, Empty, Loading, Success, and Offline State Audit

| Area | Loading | Empty | Error | Success | Offline |
|---|---:|---:|---:|---:|---:|
| Home | Missing | Not meaningfully represented | Missing | Static populated dashboard | Missing |
| Shipments | Missing | Implemented for no filter results | Missing | Static list | Missing |
| Shipment detail | Missing | Unknown ID falls back to first shipment rather than empty/not-found | Missing | Static detail/timeline | Missing |
| Send wizard | Missing | Some optional-field empties shown | Minimal local validation only | Payment confirmation and cargo-created screen | Missing |
| Payments/invoices | Simulated delay only | Filter empty states present | Gateway failure missing | Local paid state and downloads | Missing |
| Notifications | Missing | Filter empty state present | Missing | Local tab/filter presentation | Missing |
| Addresses/recipients | Missing | Not clearly represented | Missing | Static lists | Missing |
| Support | Modal opens/closes | Not applicable | Missing | Phone/email link actions | Missing |
| Profile/settings | Missing | Not clearly represented | Missing | Local toggle/display changes | Missing |
| Search/quote | Missing | Quote options are static | Missing | Local option cards | Missing |

The current UI is optimized for the happy path and prototype demonstration. It is not yet resilient to network, permission, server, payment, upload, or data-integrity failures.

## 23. Dead or Incomplete Interactions

The following interactions are visible but incomplete or local-only:

1. **Mark all read** on Notifications has no implemented state mutation.
2. **QR scan** on Home is represented by a toast rather than a scanner.
3. **Get help** cards and some Home support prompts use toasts rather than opening a support workflow.
4. **Delivery instructions** on shipment detail uses a toast and does not collect or save instructions.
5. **Proof of delivery** and receipt-related shipment actions use toast/presentation behavior without a document service.
6. **Reschedule delivery** presents hardcoded times but does not persist a chosen time.
7. **Payment** marks invoices or completes the Send flow only in local component state.
8. **Invoice and receipt downloads** generate local text files rather than retrieving official documents.
9. **Saved addresses** and **saved recipients** route into Send but do not create/edit/delete persistent records.
10. **Security rows** are informational and do not open password, verification, session, or account-deletion workflows.
11. **Quote values** are not carried into the Send wizard.
12. **Tracking lookup** recognizes only hardcoded sample identifiers and does not display a real not-found/error state.
13. **Unknown shipment IDs** resolve to the first mock shipment rather than a proper not-found page.
14. **Log out** navigates home and shows a toast, but does not clearly clear an authenticated session in the current client implementation.
15. **Support** has phone/email actions but no ticket or issue-management flow.

## 24. Code Quality and Architecture Observations

The codebase is currently optimized for speed of frontend iteration. The main architecture issues likely to affect completion are:

- The app has a single-page route shell but no connected data layer, so live integration will otherwise spread fetch/mutation logic across pages.
- Large page files, especially SendShipment and SettingsDetail, combine route decisions, business state, presentation, and interaction handlers.
- Mock data is imported directly into presentation pages rather than being accessed through repositories or feature hooks.
- Status definitions exist centrally, but lifecycle transitions are not centralized or validated.
- Notification data is local to its page instead of using the common domain/data layer.
- Form validation is inline and mostly absent; there is no shared request schema for shipment creation.
- The legacy Account page creates a duplicate account implementation and should be intentionally retired or reconnected before API work.
- The light-theme compatibility layer is useful for migration, but legacy dark utility classes remain in source and can confuse future styling work.
- The package scripts do not define a `test` command even though Vitest tests exist; validation currently requires invoking Vitest directly.
- The runtime log has reported `ERR_MODULE_NOT_FOUND: Cannot find package 'dotenv'` from `server/_core/index.ts`, while TypeScript checks for the client have passed. This server/runtime issue should be resolved before relying on the full server stack.

## 25. Current Feature Matrix

| Feature | Status | Pages | Workflow exists? | UI complete? | Integration ready? | Notes |
|---|---|---|---|---|---|---|
| Dashboard | Mostly Complete | Home | Yes | Yes for prototype | Low | Static data and local navigation |
| Shipment list | Mostly Complete | Shipments | Yes | Yes for prototype | Medium-low | Search/filter only; no API states |
| Shipment detail | Partial | ShipmentDetail | Yes | Mostly | Low | Timeline/actions are mostly static/toast |
| Shipment creation | Mostly Complete | SendShipment | Yes | Yes for happy path | Low | Local state, upload names, simulated payment |
| Draft shipment | Partial | SendShipment | Partial | Partial | Low | localStorage save without Drafts page/reopen/delete |
| Quotes | Partial | Quote | Partial | Yes visually | Low | No carried-forward quote or calculation service |
| Tracking | Partial | Home, Shipments, ShipmentDetail | Yes | Mostly | Low | Hardcoded identifiers and static timeline |
| Invoices | Mostly Complete | Invoices, SettingsDetail | Yes | Yes for prototype | Low | Mock invoices and local paid state |
| Online payment | Partial | PaymentModal, Invoices, SendShipment | Yes | Yes visually | Low | No gateway, failure, pending, webhook |
| Receipts | Partial | Invoices | Yes | Partial | Low | Local generated text download |
| Notifications | Partial | Notifications | Yes | Mostly | Low | Mark-all-read and persistence missing |
| Support | Partial | AppShell, Home | Partial | Yes for contact links | Low | No case/ticket/help center |
| Account/profile | Partial | SettingsDetail, legacy Account | Partial | Partial | Low | Static rows; no edit/persistence |
| Addresses | Partial | SettingsDetail, SendShipment | Partial | Partial | Low | Lists and routing, no CRUD |
| Recipients | Partial | SettingsDetail, SendShipment | Partial | Partial | Low | Lists and creation fields, no CRUD |
| Security/auth | Missing to Partial | SettingsDetail, AppShell | No complete workflow | Partial presentation | Low | No active auth UI/session management |
| Legal content | Mostly Complete prototype | Legal | Yes | Yes as draft content | Medium for CMS, low for compliance | Needs counsel-approved copy and acceptance/versioning |
| Backend persistence | Missing in customer flows | Server/schema only | No | No | N/A | Users schema exists but is not connected to pages |

## 26. Current Workflow Matrix

| Workflow | Entry point | End point | Can complete? | Missing step | Broken/incomplete interaction | Frontend ready? |
|---|---|---|---|---|---|---|
| Login | None | None | No | Login/provider/session | No route or active auth client | Low |
| Create shipment | Home/Send | Local success after simulated deposit | Yes for prototype | API submission, upload, payment, server reference | Local-only success | Medium-low |
| Save draft | Send wizard | localStorage toast | Partial | Draft list/reopen/delete/sync | No recovery UI | Low |
| Get quote | Home/sidebar | Send route | Partial | Persist quote details and calculate remotely | Values do not carry over | Low |
| Track shipment | Home input/Shipments | Shipment detail | Partial | Real lookup and not-found state | Hardcoded matching | Low |
| View timeline | Shipment detail | Static timeline | Yes for prototype | Live events and status transitions | Static data | Medium-low |
| Make payment | Invoice/Send | Local success/paid state | Yes for prototype | Gateway, failure, webhook, receipt | Simulated payment | Low |
| Download receipt | Invoice detail | Local text file | Partial | Official document service | Not a real receipt artifact | Low |
| Review notifications | Header bell | Shipment detail | Partial | Mark/read persistence and delivery | Mark all read does nothing | Low |
| Contact support | Sidebar/header | Phone/email | Partial | Ticket/case/chat | No support record | Medium for contact links |
| Manage addresses | Settings | Send route | No | CRUD and persistence | Add/select are redirects/toasts | Low |
| Manage recipients | Settings | Send route | No | CRUD/history | No persistent recipient selection | Low |
| Change password | Settings security | None | No | Form, auth endpoint, validation | Static row | Low |
| Edit profile | Settings account | None | No | Edit form and persistence | Static rows | Low |
| Review legal policies | Settings Legal | Policy detail | Yes as draft content | Approval, jurisdiction, acceptance | Draft-only content | Medium for content delivery |
| Request return | Legal policy only | None | No | Return request workflow | No operational route | Low |
| Reschedule delivery | Shipment detail | Local modal | No | Availability and mutation | Hardcoded times | Low |
| Report issue | None | None | No | Issue form/ticket | Not found | Low |

## 27. Missing Items

### Definitely missing

The current implementation does not contain login/registration and session-expiry workflows, real shipment APIs, public tracking, shipment cancellation, draft management, pickup scheduling, recipient/address CRUD, profile editing, password change, account deletion, support tickets, report-issue flow, returns requests, duplicate shipment, real payment gateway integration, refund handling, webhook reconciliation, official receipt storage, proof-of-delivery documents, map/courier tracking, push notification delivery, and persistent notification read state.

### Partially implemented

The main partial areas are shipment creation, tracking, invoice payment, notifications, support, settings, security, quote estimation, home delivery, rescheduling, legal content, and saved data management. Each has a coherent UI surface but stops before a durable business operation.

### UX gaps

The strongest UX gaps are the lack of visible loading/error/offline states, the absence of a Drafts recovery surface after Save as Draft, the semantic mismatch between Home wallet actions and `/account` → Settings, the unknown-shipment fallback to the first mock record, and the lack of clear user feedback when toast-only actions are not actually completed. Legal pages are clearly marked as drafts, but the app does not yet explain how policy acceptance is recorded.

### Integration gaps

The product needs a backend contract for users, shipments, shipment events, addresses, recipients, quotes, invoices, payments, receipts, notifications, support cases, and legal-version acknowledgements. It also needs file storage for cargo photos/debit notes and official documents, payment-provider integration, webhook handling, authorization rules, and server-owned lifecycle transitions.

### Architecture cleanup

Before API integration, the highest-value cleanup would be to add a feature/service layer, centralize API types and validation schemas, extract SendShipment and SettingsDetail subcomponents, remove or formally deprecate the legacy Account page, centralize notification data/filtering, define a shipment lifecycle model, standardize loading/error/empty/success components, and add a proper test script to package configuration.

## 28. What Not to Change Yet

This audit intentionally does not implement any missing feature, redesign any screen, refactor code, delete legacy files, or assume that the current product plan is still correct. The findings are a current-state snapshot to support prioritization.

## A. What the App Is Today

It is a visually coherent New World Cargo customer portal prototype with a white/yellow/navy brand system. It supports a realistic-looking dashboard, shipment browsing/tracking presentation, a five-step cargo-request wizard, quote estimation, invoice review, simulated online payment, notifications, settings, support contact links, and draft-safe legal policy pages.

## B. What Is Already Complete

The main navigation shell, mobile bottom navigation, Home dashboard composition, shipment cards, shipment list search/filter, shipment detail/timeline presentation, Send wizard structure, repeatable cargo rows, optional recipient notes, air/sea selection, office suggestions, home-delivery fee notice, mobile-safe payment modal, invoice list/detail/download presentation, notification unread/read tabs, Settings information architecture, Support contact modal, and Legal catalog/detail presentation are complete at the prototype UI level.

## C. What Is Partially Complete

Real shipment creation, drafts, tracking, payment, invoice status, receipts, notifications, support, settings, addresses, recipients, account/security, quote carry-forward, rescheduling, and legal compliance are partially complete because the interface exists but the underlying business operations are local, simulated, static, or absent.

## D. What Is Missing

The confirmed missing capabilities are authentication screens and session management, backend persistence, live shipment/tracking services, public tracking, operational pickup/delivery scheduling, account/profile editing, address/recipient CRUD, support cases, issue reporting, returns requests, real payment/refund/reconciliation flows, official receipts/proof of delivery, notification persistence/delivery, and legal acceptance/version tracking.

## E. What Appears Broken

The clearest broken or misleading behaviors are Mark all read doing nothing, QR scan being a toast, shipment IDs falling back to the first mock record, delivery instructions/proof-of-delivery/reschedule controls not persisting, invoice/payment success existing only in local state, quote values not reaching Send, logout not visibly clearing a session, and the observed server log error indicating a missing `dotenv` package in the server runtime path. The client TypeScript check and production Vite build have passed in recent validation, but the server runtime warning remains a separate concern.

## F. Integration Readiness

The frontend is **visually ready but operationally early**. Static domain types and mock records provide a useful starting vocabulary, and the route map is clear enough to introduce feature APIs. However, there is no active query/mutation layer, authentication guard, persistent customer state, upload service, payment gateway, webhook processing, or standardized async-state system. A real integration should begin with identity and customer wallet assignment, then shipments/events, addresses/recipients, invoices/payments, notifications, and support. Each customer should have an assigned wallet record and balance/ledger boundary before the payment UI is connected to production behavior.

## G. Recommended Next Audit

The next audit should focus on the **backend contract and authentication boundary**, not another visual pass. Specifically, review the intended customer identity model, assigned wallet model, shipment and event lifecycle, invoice/payment/refund ownership, file-storage requirements for cargo evidence and receipts, and the API/error/loading conventions that every current page will consume. Once that contract is approved, the next implementation priority can be selected from a reliable product baseline.

## References

The following local project files were used as evidence for this report:

1. [App route registration](client/src/App.tsx)
2. [Shared application shell](client/src/components/app-shell.tsx)
3. [Canonical mock data](client/src/lib/mock-data.ts)
4. [Domain types](client/src/lib/domain.ts)
5. [Shared shipment UI](client/src/components/shipment-ui.tsx)
6. [Send Shipment wizard](client/src/pages/SendShipment.tsx)
7. [Invoices and billing](client/src/pages/Invoices.tsx)
8. [Settings hub](client/src/pages/Settings.tsx)
9. [Settings detail workflows](client/src/pages/SettingsDetail.tsx)
10. [Legal pages](client/src/pages/Legal.tsx)
11. [Notifications page](client/src/pages/Notifications.tsx)
12. [Global design tokens](client/src/index.css)
13. [Project package configuration](package.json)
14. [Database schema](drizzle/schema.ts)
15. [Current project checklist](todo.md)
