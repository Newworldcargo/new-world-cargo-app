# New World Cargo Customer App — Design Direction

## Ground-truth reference

The uploaded shipping app mockups are the visual source of truth. The product should feel like a pocket-sized control center for deliveries: dark, confident, direct, and friendly. The app should preserve the reference's high-contrast dark canvas, warm cargo yellow, lavender route/status accent, stacked shipment cards, route timelines, prominent tracking input, and persistent bottom navigation. It should simplify logistics language into plain customer actions and keep the important next step visible.

## Design Movement

Reference-matched **editorial utility / mobile command center**: a blend of contemporary dark-mode product UI, airport departure-board clarity, and tactile courier packaging. The interface is expressive through color blocks and motion, but every visual decision supports quick scanning and action.

## Core Principles

1. **Clarity before operations language.** Customers see “On the way,” “Arriving today,” and “Choose a delivery time,” never internal routing codes or warehouse jargon.
2. **Shipment as the central object.** A shipment card carries its state, route, ETA, and the small set of actions that are valid right now.
3. **High-contrast warmth.** Charcoal and near-black create focus; New World Cargo yellow marks action and optimism; lavender marks motion and progress; coral is reserved for exceptions.
4. **Pocket-sized confidence.** Every screen should be usable one-handed, comfortable at a 375px viewport, and structured around a clear thumb-reachable action.

## Color Philosophy

The dark canvas reduces visual noise and makes the customer's shipment the focus. The ownable signature color is **Cargo Yellow `#FFC83D`**, used for primary calls to action and the hero shipment card. **Route Lavender `#8178FF`** communicates movement and makes tracking feel alive. **Mint `#BFE8D8`** marks “arriving today” and positive completion. **Signal Coral `#FF6B5E`** appears only for delays, failed delivery attempts, and urgent support needs. White is soft rather than pure in most text, maintaining the calm precision of the reference.

## Layout Paradigm

The app uses a **vertical command ribbon** rather than a centered dashboard. A compact greeting and notification affordance sit above a wide tracking rail. Quick actions form two asymmetric tiles. The main shipment card then stacks vertically with route, status, and contextual actions. On larger screens, the mobile-first app becomes a narrow, floating “phone-like” workspace anchored in a spacious dark shell with a right-side context rail for helpful shipment summary rather than stretching every card edge-to-edge.

## Signature Elements

- A white pill-shaped **Track a package** rail with a dark scan button.
- Layered shipment cards with a bright yellow front face and subtle lavender/coral edge offsets.
- Thin route lines with solid dots for completed milestones, a ring for the current milestone, and a dashed continuation for what is next.

## Interaction Philosophy

Interactions should feel immediate and tactile. Buttons compress slightly on press, status chips respond with a quick color/position change, cards lift only when their elevation communicates selection, and route progress is revealed with a restrained 180–240ms transition. Important actions are context-aware: a shipment in transit shows “Track” and “Share,” while a delivered shipment shows “Proof of delivery” and “Send again.” Any unfinished integration uses a toast that explains what will happen next instead of a dead button.

## Animation

Use short ease-out transitions with a physical snap. Page sections enter in a 40–60ms stagger; shipment cards reveal from 0.98 scale plus opacity, never from zero scale. Tracking results slide up from the search rail. Timeline progress uses a 220ms fill transition. Respect `prefers-reduced-motion` and keep all functional state changes understandable without motion.

## Typography System

Use **Poppins** as the single family across the app, honoring the user's explicit brand preference. Use 800 weight for display headings and shipment IDs, 700 for action headings and section titles, 600 for operational labels, and 400–500 for body copy. Headlines are bold and compact; labels are medium weight with generous tracking; body copy stays between 14–16px with 1.45 line-height. Avoid mixing in a second font family so the product feels intentional and portable.

## Brand Essence

**New World Cargo is the simple, customer-first way to send and follow packages between Zambia, China, and everywhere local—without making the customer learn logistics.** Personality: **assured, practical, warm**.

## Brand Voice

Headlines are concise and action-led. CTAs say exactly what happens next. Microcopy is calm and human, especially around exceptions.

Example lines:

> “Your package is moving. We’ll keep watch.”

> “Send it from here. We’ll handle the rest.”

## Wordmark & Logo

Use a compact symbol built from four offset cargo-arrow bars forming an abstract **N/W** monogram, paired with a small uppercase `NEW WORLD` over `CARGO` lockup. The symbol should work alone in the app header and favicon; the wordmark should use Space Grotesk with custom letter spacing, not a default browser wordmark.

## Signature Brand Color

**Cargo Yellow `#FFC83D`** — a warm, ownable yellow that feels like a parcel label under morning light. It is bright enough to guide action on charcoal without looking like generic warning yellow.

## Initial Product Surface

The first frontend delivery includes Home with tracking, quick actions, active shipments, Shipments with filters, a shipment detail view with journey and contextual actions, Send Shipment with a multi-step flow, a quote preview, pickup scheduling, notifications, Account, saved addresses, recipients, payment methods, and support/problem states. The frontend uses thoughtfully chosen sample content only for demonstrating UI states; no customer reviews or testimonials are fabricated.

## Style Decisions

- The primary header mark uses a visible four-offset-bar cargo-arrow N/W monogram, with the generated mark asset layered into the symbol treatment rather than relying on an unbranded square.
- Route Lavender is reserved for active movement and current journey state, Mint for arriving or completed confidence, and Signal Coral only for delivery problems or urgent exceptions.
- Every primary screen includes at least one cargo-control motif: a route rail, shipment ID label, status chip, package edge layer, or timeline marker.
