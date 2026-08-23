// New World Cargo style reminder: Poppins, dark command-center canvas, Cargo Yellow action color, lavender route accents, mobile-first.

import type { Address, DeliveryOption, Invoice, Recipient, Shipment } from "./domain";

export const ASSETS = {
  hero: "https://www.newworldcargo.com/images/home1.webp",
  package: "https://www.newworldcargo.com/images/home1.webp",
  route: "https://www.newworldcargo.com/images/home1.webp",
  mark: "/new-world-cargo-logo.png",
};

export const shipments: Shipment[] = [
  {
    id: "shipment-48291",
    trackingNumber: "NWC48291ZM",
    carrier: "New World Cargo",
    transportMode: "air",
    packageName: "Home goods",
    origin: "Guangzhou, China",
    destination: "Lusaka, Zambia",
    eta: "Arrives 18 Aug",
    status: "in_transit",
    statusLabel: "In transit",
    price: "K 1,280",
    image: ASSETS.package,
    progress: 58,
    nextAction: "Your package is moving through our delivery network.",
    events: [
      { label: "Shipment created", detail: "Guangzhou, China", time: "12 Aug · 09:14", complete: true },
      { label: "Picked up", detail: "Guangzhou warehouse", time: "12 Aug · 16:42", complete: true },
      { label: "In transit", detail: "Moving to destination", time: "14 Aug · 11:28", current: true },
      { label: "At destination", detail: "Lusaka facility", time: "Expected 17 Aug" },
      { label: "Out for delivery", detail: "Courier on the way", time: "Expected 18 Aug" },
    ],
  },
  {
    id: "shipment-19034",
    trackingNumber: "NWC19034ZM",
    carrier: "New World Cargo",
    transportMode: "air",
    packageName: "Import documents",
    origin: "Lusaka, Zambia",
    destination: "Ndola, Zambia",
    eta: "Arriving today",
    status: "out_for_delivery",
    statusLabel: "Arriving today",
    price: "K 180",
    progress: 86,
    nextAction: "Courier is nearby. Add a delivery instruction if needed.",
    events: [
      { label: "Shipment created", detail: "Lusaka", time: "13 Aug · 08:05", complete: true },
      { label: "Picked up", detail: "Lusaka office", time: "13 Aug · 10:18", complete: true },
      { label: "At destination", detail: "Ndola facility", time: "14 Aug · 07:42", complete: true },
      { label: "Out for delivery", detail: "Courier on the way", time: "Today · 09:12", current: true },
      { label: "Delivered", detail: "Recipient confirmation", time: "Expected today" },
    ],
  },
  {
    id: "shipment-77120",
    trackingNumber: "NWC77120ZM",
    carrier: "New World Cargo",
    transportMode: "sea",
    packageName: "Personal parcel",
    origin: "Lusaka, Zambia",
    destination: "Kitwe, Zambia",
    eta: "Delayed · Action needed",
    status: "delayed",
    statusLabel: "Delayed",
    price: "K 260",
    progress: 45,
    nextAction: "We couldn't reach the recipient. Choose a new delivery time.",
    events: [
      { label: "Shipment created", detail: "Lusaka", time: "11 Aug · 15:20", complete: true },
      { label: "Picked up", detail: "Lusaka office", time: "12 Aug · 08:10", complete: true },
      { label: "Delivery attempt", detail: "Recipient unavailable", time: "13 Aug · 16:08", current: true },
      { label: "Reschedule delivery", detail: "Choose another time", time: "Action needed" },
    ],
  },
];

export const addresses: Address[] = [
  { id: "home", label: "Home", line: "Plot 18, Kabulonga Road, Lusaka", landmark: "Near Arcades", default: true },
  { id: "office", label: "Office", line: "Shop 62/A, Carousel Shopping Centre", landmark: "Great East Road, Lusaka" },
  { id: "warehouse", label: "China warehouse", line: "Baiyun District, Guangzhou", landmark: "New World Cargo receiving desk" },
];

export const pickupOfficeSuggestions = [
  { id: "china-guangzhou", name: "China office", address: "Baiyun District, Guangzhou, China", detail: "New World Cargo receiving office" },
  { id: "zambia-lusaka", name: "Zambia office", address: "Shop 62/A, Carousel Shopping Centre, Lusaka", detail: "New World Cargo pickup office" },
  { id: "kitwe", name: "Kitwe office", address: "Kitwe, Zambia", detail: "New World Cargo pickup office" },
  { id: "dubai", name: "Dubai office", address: "Dubai, United Arab Emirates", detail: "New World Cargo receiving office" },
];

export const recipients: Recipient[] = [
  { id: "jane", name: "Jane Banda", location: "Lusaka", phone: "+260 977 123 456", initials: "JB" },
  { id: "michael", name: "Michael Phiri", location: "Ndola", phone: "+260 966 456 789", initials: "MP" },
  { id: "business", name: "Kafue Office", location: "Kafue", phone: "+260 955 238 910", initials: "KO" },
];

export const deliveryOptions: DeliveryOption[] = [
  { id: "standard", name: "Standard", detail: "Reliable delivery for everyday shipments", eta: "4–6 days", price: "K 180" },
  { id: "express", name: "Express", detail: "Priority handling from pickup to arrival", eta: "2–3 days", price: "K 320", recommended: true },
  { id: "same-day", name: "Same day", detail: "Local Lusaka delivery when time matters", eta: "Today", price: "K 450" },
];

export const cargoTransportOptions = [
  { id: "air", name: "Air cargo", detail: "Priority forwarding for time-sensitive cargo", eta: "5–10 working days" },
  { id: "sea", name: "Sea cargo", detail: "A lower-cost option for less urgent cargo", eta: "6–10 weeks" },
] as const;

export const invoices: Invoice[] = [
  {
    id: "inv-2026-0812",
    invoiceNumber: "NWC-INV-0812",
    shipmentId: "shipment-48291",
    shipmentLabel: "Home goods",
    route: "Guangzhou, China → Lusaka, Zambia",
    issuedAt: "12 Aug 2026",
    dueAt: "20 Aug 2026",
    status: "unpaid",
    amount: "K 1,280",
    amountValue: 1280,
    currency: "ZMW",
    lineItems: [
      { label: "Air cargo forwarding", detail: "Home goods · NWC48291ZM", amount: "K 1,050" },
      { label: "Destination handling", amount: "K 150" },
      { label: "Local delivery", amount: "K 80" },
    ],
  },
  {
    id: "inv-2026-0809",
    invoiceNumber: "NWC-INV-0809",
    shipmentId: "shipment-19034",
    shipmentLabel: "Import documents",
    route: "Lusaka → Ndola, Zambia",
    issuedAt: "9 Aug 2026",
    dueAt: "14 Aug 2026",
    status: "paid",
    amount: "K 180",
    amountValue: 180,
    currency: "ZMW",
    paymentMethod: "Mobile money · •••• 4821",
    paidAt: "10 Aug 2026",
    lineItems: [
      { label: "Local delivery", detail: "Import documents · NWC19034ZM", amount: "K 160" },
      { label: "Handling fee", amount: "K 20" },
    ],
  },
  {
    id: "inv-2026-0728",
    invoiceNumber: "NWC-INV-0728",
    shipmentId: "shipment-77120",
    shipmentLabel: "Personal parcel",
    route: "Lusaka → Kitwe, Zambia",
    issuedAt: "28 Jul 2026",
    dueAt: "2 Aug 2026",
    status: "paid",
    amount: "K 260",
    amountValue: 260,
    currency: "ZMW",
    paymentMethod: "Visa ending 1042",
    paidAt: "30 Jul 2026",
    lineItems: [
      { label: "Standard delivery", detail: "Personal parcel · NWC77120ZM", amount: "K 220" },
      { label: "Handling fee", amount: "K 40" },
    ],
  },
  {
    id: "inv-2026-0615",
    invoiceNumber: "NWC-INV-0615",
    shipmentLabel: "Office supplies",
    route: "Dubai, UAE → Lusaka, Zambia",
    issuedAt: "15 Jun 2026",
    dueAt: "22 Jun 2026",
    status: "paid",
    amount: "K 920",
    amountValue: 920,
    currency: "ZMW",
    paymentMethod: "Mobile money · •••• 4821",
    paidAt: "18 Jun 2026",
    lineItems: [
      { label: "Air cargo forwarding", detail: "Office supplies", amount: "K 760" },
      { label: "Destination handling", amount: "K 160" },
    ],
  },
];
