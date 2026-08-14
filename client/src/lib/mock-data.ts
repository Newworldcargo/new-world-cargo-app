// New World Cargo style reminder: Poppins, dark command-center canvas, Cargo Yellow action color, lavender route accents, mobile-first.

import type { Address, DeliveryOption, Recipient, Shipment } from "./domain";

export const ASSETS = {
  hero: "/manus-storage/nwc-cargo-reference_6269971b.jpg",
  package: "/manus-storage/nwc-package-detail_de080b3d.jpg",
  route: "/manus-storage/nwc-route-abstract_b3a9b7d0.jpg",
  mark: "/manus-storage/nwc-mark_9c1ea399.png",
};

export const shipments: Shipment[] = [
  {
    id: "shipment-48291",
    trackingNumber: "NWC48291ZM",
    carrier: "New World Cargo",
    category: "Shopping",
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
    category: "Documents",
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
    category: "Gift",
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

