# New World Cargo Frontend TODO

- [x] Update the visual system to use Poppins for all app typography and align brand tokens with the company site.
- [x] Create reusable UI primitives and domain components before composing pages.
- [x] Define central shipment, recipient, address, package, pickup, payment, tracking-event, notification, and support-case types.
- [x] Keep state scoped deliberately: local UI state in components, multi-step draft state in a shared client context, and URL state for deep-linkable shipment views and filters.
- [x] Centralize shipment lifecycle statuses, customer-facing labels, colors, icons, and contextual actions.
- [x] Add loading, empty, error, offline, and success states for primary customer workflows.
- [x] Keep all frontend files mobile-first, accessible, keyboard-friendly, and consistent with the reference mockup.
- [x] Use Tailwind utilities and centralized CSS variables instead of scattered hardcoded styles.
- [x] Verify the tracking flow, shipment detail flow, send flow, quote flow, and notification/account navigation before delivery.

## Light mode revision

- [x] Replace dark canvas and panel tokens with light-mode surfaces while preserving readable navy text and yellow actions.
- [x] Update the app shell, navigation, shipment cards, forms, rails, status chips, and support surfaces for light-mode contrast.
- [x] Re-check active, arriving, delayed, and completed shipment states so lavender, mint, coral, and yellow retain their semantic roles.
- [x] Run type/build checks and verify the primary mobile and desktop layouts after the transition.

## White canvas refinement

- [x] Make the overall application canvas, header, and desktop content background true white.
- [x] Keep Cargo Yellow reserved for active navigation, primary actions, and shipment highlights.
- [x] Rebalance supporting cards and controls with subtle cool-gray borders and surfaces for separation.
- [x] Verify the white canvas across mobile and desktop, then run type/build checks.

## Minimalist refinement

- [x] Preserve all existing layout and information hierarchy while reducing elevation effects.
- [x] Replace broad button and card shadows with thin borders, tonal contrast, and restrained interaction states.
- [x] Keep emphasis only where it supports a primary action or shipment state.
- [x] Verify desktop and mobile visuals, then run type/build checks.

## Customer-first post-login home

- [x] Define the first actions for signed-in customers with existing bookings or orders.
- [x] Place active booking status, tracking, payment or wallet status, delivery management, and support ahead of promotional content.
- [x] Move banners and secondary discovery content lower in the home screen without disturbing the established visual system.
- [x] Verify the revised action hierarchy across mobile and desktop, then run type/build checks.

## Customer workflow definition

- [x] Identify the signed-in customer's decisive first choice and distinguish receiving from sending without duplicating the underlying shipment lifecycle.
- [x] Define receiving, local sending, and international sending from origin/destination details through quote, booking, payment, and tracking.
- [x] Map existing app actions and screens to each workflow stage, including wallet/payment and support touchpoints.
- [x] Confirm the business decisions still required before wiring workflows to live services.

## Cargo receiving and forwarding workflow

- [x] Replace the generic sender-recipient framing with a cargo-owner journey in which a supplier sends cargo to a New World Cargo origin office.
- [x] Define origin-office registration, debit-note capture, forwarding to Zambia or another destination, arrival warehousing, notification, and end-of-service charging.
- [x] Map local delivery, collection, and onward cross-border delivery choices after the cargo reaches its destination warehouse.
- [x] Revise the workflow specification and identify the minimum future logic needed while keeping the existing UI design intact.

## Typography normalization

- [x] Remove expanded tracking, decorative uppercase treatments, and custom leading that fight Poppins’ natural rhythm.
- [x] Preserve hierarchy through size, weight, color, and spacing rather than spread lettering.
- [x] Verify natural typography spacing on both mobile and desktop, then run type/build checks.

## Pickup office suggestions

- [x] Define reusable New World Cargo origin-office suggestions for China, Zambia, Kitwe, and Dubai.
- [x] Show filtered office suggestions when the pickup address is focused or typed into, while retaining custom entry.
- [x] Support pointer and keyboard selection, then verify mobile and desktop behavior with frontend checks.

## Cargo-creation workflow

- [x] Replace weight-first input with a description of parcel contents and optional estimated details.
- [x] Add photo and delivery-note/debit-note upload controls with clear client-side feedback.
- [x] Replace delivery-speed choices with Air cargo and Sea cargo options, including indicative transit times.
- [x] Add collection-from-office versus final-address-delivery selection before the review and payment step.
- [x] Verify the completed flow on mobile and desktop, then run frontend checks.

## Official brand assets

- [x] Retrieve the official New World Cargo logo and favicon from the company website.
- [x] Apply the official website favicon and a company-approved official logo to the app shell.
- [x] Verify asset rendering, then run frontend checks.

## Supplied yellow logo

- [x] Upload the user-supplied official yellow logo as a stable web app asset.
- [x] Replace the current app lockup with the supplied yellow logo while retaining the website favicon.
- [x] Verify the supplied logo on mobile and desktop, then run frontend checks.

## UI refinement verification

- [x] Remove active-navigation dots while preserving active background and text treatment.
- [x] Add a floating profile menu with profile, settings, and logout actions using icons.
- [x] Restyle the shipment-flow back control as a standard yellow button and verify the refined controls.

## Invoices & billing

- [x] Define the invoice domain model, invoice statuses, payment metadata, and receipt availability.
- [x] Add representative recent and historical paid/unpaid invoice data for the customer-facing UI.
- [x] Build a dedicated Invoices & Billing page with recent invoices, historical invoices, status filters, and clear totals.
- [x] Add invoice detail interactions with invoice download for all invoices and receipt download for paid invoices.
- [x] Add Invoices & Billing to desktop sidebar and mobile navigation without replacing Shipments.
- [x] Verify invoice list, detail/download actions, responsive layouts, and frontend checks.
- [ ] Save a new checkpoint after verification.

## Style reminder for the billing feature

Keep the established New World Cargo design: light mode, white canvas, Poppins typography, navy text, Cargo Yellow for primary actions and active states, restrained borders instead of heavy shadows, and mobile-first responsive behavior. Billing should feel operational and trustworthy rather than promotional.

## Reusable online payment modal

- [x] Define reusable payment-method state for saved mobile-money and card preferences.
- [x] Build a reusable modal that supports mobile money, ATM/debit card payment, and adding a method during checkout.
- [x] Remember and preselect the last successful payment method for future payments.
- [x] Open the modal from unpaid invoice payment actions and the shipment checkout step.
- [x] Verify payment selection, inline method entry, confirmation feedback, and responsive behavior.
- [ ] Save a new checkpoint after verification.

## Navigation edit verification

- [x] Resolve the stale shared-navigation target by replacing the Account destination with the requested Settings hub.
- [x] Confirm desktop and mobile navigation remain clear and functional after the Settings replacement.
- [ ] Save a new checkpoint after verification.

## Settings hub and separate pages

- [x] Rename the Account navigation destination to Settings while keeping a clear route from the hub.
- [x] Create a minimalist Settings hub with links for account details, saved addresses, saved recipients, notifications, payment methods, security, and receipts & billing.
- [x] Create a dedicated account details screen with profile and verified-contact management.
- [x] Create separate saved-addresses and saved-recipients management screens.
- [x] Create dedicated notifications, payment-methods, and security preference screens.
- [x] Create a dedicated receipts & billing screen connected to the existing invoices destination.
- [x] Verify every Settings link leads to its separate responsive page and that navigation remains clear.
- [ ] Save a new checkpoint after verification.

## Secondary brand color

- [x] Establish #012642 as the New World Cargo secondary brand color in shared design tokens.
- [x] Apply the secondary brand color to bold text and high-emphasis typography throughout the app.
- [x] Update the design-system documentation with the color’s intended role alongside Cargo Yellow.
- [x] Verify contrast and visual consistency on representative desktop and mobile screens.
- [ ] Save a new checkpoint after verification.
