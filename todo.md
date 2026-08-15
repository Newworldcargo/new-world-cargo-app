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
