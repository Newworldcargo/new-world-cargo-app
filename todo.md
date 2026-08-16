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
- [x] Save a new checkpoint after verification.

## Style reminder for the billing feature

Keep the established New World Cargo design: light mode, white canvas, Poppins typography, navy text, Cargo Yellow for primary actions and active states, restrained borders instead of heavy shadows, and mobile-first responsive behavior. Billing should feel operational and trustworthy rather than promotional.

## Reusable online payment modal

- [x] Define reusable payment-method state for saved mobile-money and card preferences.
- [x] Build a reusable modal that supports mobile money, ATM/debit card payment, and adding a method during checkout.
- [x] Remember and preselect the last successful payment method for future payments.
- [x] Open the modal from unpaid invoice payment actions and the shipment checkout step.
- [x] Verify payment selection, inline method entry, confirmation feedback, and responsive behavior.
- [x] Save a new checkpoint after verification.

## Navigation edit verification

- [x] Resolve the stale shared-navigation target by replacing the Account destination with the requested Settings hub.
- [x] Confirm desktop and mobile navigation remain clear and functional after the Settings replacement.
- [x] Save a new checkpoint after verification.

## Settings hub and separate pages

- [x] Rename the Account navigation destination to Settings while keeping a clear route from the hub.
- [x] Create a minimalist Settings hub with links for account details, saved addresses, saved recipients, notifications, payment methods, security, and receipts & billing.
- [x] Create a dedicated account details screen with profile and verified-contact management.
- [x] Create separate saved-addresses and saved-recipients management screens.
- [x] Create dedicated notifications, payment-methods, and security preference screens.
- [x] Create a dedicated receipts & billing screen connected to the existing invoices destination.
- [x] Verify every Settings link leads to its separate responsive page and that navigation remains clear.
- [x] Save a new checkpoint after verification.

## Secondary brand color

- [x] Establish #012642 as the New World Cargo secondary brand color in shared design tokens.
- [x] Apply the secondary brand color to bold text and high-emphasis typography throughout the app.
- [x] Update the design-system documentation with the color’s intended role alongside Cargo Yellow.
- [x] Verify contrast and visual consistency on representative desktop and mobile screens.
- [x] Save a new checkpoint after verification.

## Navigation and shipment-label visual edits

- [x] Remove Alerts from the shared desktop and mobile navigation menus.
- [x] Identify the repeated shipment-page text selected in the stale editor and remove it across affected views.
- [x] Replace the shipment-mode label with a concise Air cargo or Sea cargo icon and label treatment.
- [x] Keep the shipment index at two cards per row on desktop and one card per row on mobile, without a promoted wide first card.
- [x] Verify the updated navigation and shipment details on desktop and mobile.
- [x] Save a new checkpoint after verification.

## Two-color shipment palette

- [x] Limit shipment cards, status treatments, route rails, and supporting accents to Cargo Yellow and #012642 blue.
- [x] Apply Cargo Yellow to Air cargo and #012642 blue to Sea cargo wherever transport is shown.
- [x] Remove light-blue, pink, lavender, mint, and coral accents from shipment surfaces and layers.
- [x] Use blue and yellow variation, borders, icons, and typography to preserve shipment-state clarity.
- [x] Update the design-system documentation with the approved two-color shipment palette.
- [x] Verify the revised shipment surfaces on desktop and mobile.
- [x] Save a new checkpoint after verification.

## Responsive navigation order

- [x] Place Send second in the desktop navigation menu.
- [x] Place Send third in the mobile bottom navigation menu.
- [x] Verify navigation order and touch target clarity across desktop and mobile.
- [x] Save a new checkpoint after verification.

## Sea cargo label visibility

- [x] Render the Sea cargo label and ship icon in white on #012642 shipment cards.
- [x] Verify the Sea cargo badge remains legible on desktop and mobile.
- [x] Save a new checkpoint after verification.

## Shipment control removal

- [x] Remove the duplicated shipment-request route-progress banner while retaining the existing dashed tracking lines.
- [x] Verify the shipment request remains clear and actionable after the banner removal.
- [x] Save a new checkpoint after verification.

## Shared subpage back button

- [x] Extract the shipment wizard’s yellow back control into a reusable component or shared pattern.
- [x] Apply the shared back button to shipment details, settings subpages, and every other existing subpage with a back action.
- [x] Verify back-button labels, destinations, visual consistency, and keyboard accessibility.
- [x] Save a new checkpoint after verification.

## Final customer-workflow refinements

- [x] Replace the desktop Pickup locations shortcut with Need a hand support and move Log out into the bottom sidebar slot.
- [x] Remove remaining purple, green, mint, coral, and lavender accents from customer-facing UI in favor of Cargo Yellow and #012642 blue.
- [x] Remove the repeated New cargo request subtitle from the Send workflow.
- [x] Add optional recipient notes to the shipment recipient step and review.
- [x] Add repeatable cargo rows with cargo name and quantity inputs, including add and remove controls.
- [x] Add clear possible-extra-fee messaging when home delivery is selected.
- [x] Make the reusable payment modal vertically responsive and scrollable on mobile.
- [x] Replace the Notifications banner with a simple Unread / Read tab switch and preserve brand colors.
- [x] Complete remaining Settings hub placeholder workflows with dedicated, actionable screens.
- [x] Add or update Vitest coverage for the final workflow refinements.
- [x] Verify responsive UI and save a new checkpoint after all refinements are complete.

## Support and mobile homepage refinement

- [x] Rename the Need a hand shortcut to Support and use a support/help icon instead of the star icon.
- [x] Simplify the logout button copy to Log out only while preserving its existing yellow-accented design.
- [x] Prevent horizontal overflow on the mobile homepage so all cards fit within the viewport.
- [x] Change the mobile floating bottom navigation background to #012642 and use Cargo Yellow for the active item text/icon.
- [x] Verify mobile and desktop responsive behavior with tests/build checks and save a new checkpoint.

## Bottom-left logout treatment refinement

- [x] Keep the bottom-left shell surface white and make the Log out button’s Cargo Yellow accent stronger and clearly visible.
- [x] Verify the updated treatment on desktop and mobile, then save a new checkpoint.

## Homepage card responsiveness correction

- [x] Make the Next delivery and Wallet & payments cards fit the mobile viewport without clipped content.
- [x] Reflow card headers, status badges, route details, and payment controls responsively while preserving desktop layout.
- [x] Verify the corrected homepage at mobile and desktop widths, then save a new checkpoint.

## Sidebar spacing refinement

- [x] Add clear vertical spacing between the Support shortcut and the Log out button in the desktop left menu.
- [x] Verify the sidebar spacing and save a new checkpoint.

## Settings legal section

- [x] Add a Legal section after Preferences and Payments in the Settings hub.
- [x] Add dedicated Privacy Policy and Terms of Use workflows.
- [x] Add dedicated Returns and Refunds, Shipping Policy, Payment Terms, and Acceptable Use / Customer Responsibilities workflows.
- [x] Add legal contact and policy-version presentation without fabricating company-specific legal facts.
- [x] Verify legal routes and responsive presentation, add regression coverage where appropriate, and save a new checkpoint.

## Shipment wizard navigation refinement

- [x] Add a Back button to the Send Shipment wizard for returning to the previous step or leaving the flow safely.
- [x] Add a left-aligned Save as Draft button to the Send Shipment wizard.
- [x] Verify the wizard actions on desktop and mobile, add regression coverage where appropriate, and save a new checkpoint.

## Current-state product audit

- [x] Inventory all customer-facing pages and routes.
- [x] Inventory navigation, reusable UI components, forms, modals, and shared design system elements.
- [x] Document workflows, local/mock data, persistence boundaries, tests, and build status.
- [x] Identify known limitations, placeholders, and prioritized missing features.
- [x] Deliver a complete current-state audit report for planning the next product phase.

## Authentication and account-access frontend

- [x] Add a reusable signed-out AuthLayout that preserves the New World Cargo brand system and excludes the authenticated AppShell.
- [x] Add public routes for Login, Register, Verify, Forgot Password, Reset Password, Complete Profile, and Session Expired.
- [x] Add shared password visibility and password-requirements components with reusable validation.
- [x] Add mocked login/register/Google-auth states, inline validation, loading, account-disabled, unverified, and recoverable error states.
- [x] Add OTP verification states including incomplete/incorrect/expired/resend/attempt-limit/success handling.
- [x] Add mocked auth session state so signed-out routes do not show AppShell and successful auth enters the existing app.
- [x] Connect Settings security/profile actions to the new auth routes or appropriate inline dialogs without redesigning completed screens.
- [x] Add regression tests for auth validation, route/session behavior, and password/OTP helpers.
- [x] Verify responsive auth screens and preserve existing customer pages, then save a new checkpoint.

## Settings workflow completion

- [x] Convert /settings/addresses into full CRUD with add, edit, delete, default-address, validation, and modal workflows.
- [x] Persist saved-address changes within the current frontend state and prepare the data boundary for backend persistence.
- [x] Add a dedicated sign-in activity page with a complete activity list, device/session details, and security actions.
- [x] Review every remaining Settings hub link for dead ends, placeholder-only actions, or missing detail pages and complete them.
- [x] Add regression coverage for address CRUD and sign-in activity, verify responsive workflows, and save a new checkpoint.
