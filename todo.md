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
