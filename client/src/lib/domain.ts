// New World Cargo style reminder: Poppins, dark command-center canvas, Cargo Yellow action color, lavender route accents, mobile-first.

export type ShipmentStatus =
  | "pending"
  | "pickup_scheduled"
  | "picked_up"
  | "in_transit"
  | "at_destination"
  | "out_for_delivery"
  | "delivered"
  | "delayed"
  | "failed";

export type TrackingEvent = {
  label: string;
  detail: string;
  time: string;
  complete?: boolean;
  current?: boolean;
};

export type Shipment = {
  id: string;
  trackingNumber: string;
  carrier: string;
  transportMode: "air" | "sea";
  packageName: string;
  origin: string;
  destination: string;
  eta: string;
  status: ShipmentStatus;
  statusLabel: string;
  price: string;
  image?: string;
  progress: number;
  events: TrackingEvent[];
  nextAction?: string;
};

export type Address = {
  id: string;
  label: string;
  line: string;
  landmark: string;
  default?: boolean;
};

export type Recipient = {
  id: string;
  name: string;
  location: string;
  phone: string;
  initials: string;
};

export type DeliveryOption = {
  id: string;
  name: string;
  detail: string;
  eta: string;
  price: string;
  recommended?: boolean;
};

export type InvoiceStatus = "paid" | "unpaid";

export type Invoice = {
  id: string;
  invoiceNumber: string;
  shipmentId?: string;
  shipmentLabel: string;
  route: string;
  issuedAt: string;
  dueAt: string;
  status: InvoiceStatus;
  amount: string;
  amountValue: number;
  currency: string;
  lineItems: { label: string; detail?: string; amount: string }[];
  paymentMethod?: string;
  paidAt?: string;
};
