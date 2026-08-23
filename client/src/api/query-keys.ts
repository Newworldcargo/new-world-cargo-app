import type { InvoiceListFilters, ShipmentListFilters } from "./ports";

export const queryKeys = {
  session: () => ["session"] as const,
  dashboard: (customerId: string) => ["dashboard", customerId] as const,
  shipments: {
    all: (customerId: string) => ["shipments", customerId] as const,
    list: (customerId: string, filters: ShipmentListFilters) => ["shipments", customerId, "list", filters] as const,
    detail: (customerId: string, shipmentId: string) => ["shipments", customerId, "detail", shipmentId] as const,
    tracking: (trackingNumber: string) => ["tracking", trackingNumber] as const,
  },
  invoices: {
    all: (customerId: string) => ["invoices", customerId] as const,
    list: (customerId: string, filters: InvoiceListFilters) => ["invoices", customerId, "list", filters] as const,
    detail: (customerId: string, invoiceId: string) => ["invoices", customerId, "detail", invoiceId] as const,
  },
  wallet: {
    detail: (customerId: string) => ["wallet", customerId, "detail"] as const,
  },
  profile: {
    addresses: (customerId: string) => ["profile", customerId, "addresses"] as const,
    recipients: (customerId: string, query = "") => ["profile", customerId, "recipients", query] as const,
  },
  notifications: {
    all: (customerId: string) => ["notifications", customerId] as const,
    list: (customerId: string) => ["notifications", customerId, "list"] as const,
  },
  support: {
    list: (customerId: string) => ["support", customerId, "list"] as const,
  },
  returns: {
    list: (customerId: string) => ["returns", customerId, "list"] as const,
  },
  pickups: {
    detail: (customerId: string) => ["pickups", customerId, "detail"] as const,
  },
  security: {
    sessions: (customerId: string) => ["security", customerId, "sessions"] as const,
  },
  referenceData: () => ["reference-data"] as const,
};
