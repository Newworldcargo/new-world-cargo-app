import { ASSETS, addresses, cargoTransportOptions, deliveryOptions, invoices, pickupOfficeSuggestions, recipients, shipments } from "@/lib/mock-data";
import type { AddressDto, AddressInput, CustomerReferenceData, FileUploadIntentDto, FileUploadIntentInput, InvoiceDto, PaymentIntentDto, PaymentIntentInput, RecipientDto, RecipientInput, ShipmentAction, ShipmentDto } from "../contracts";
import type { CustomerPortalPort, CustomerScope, InvoiceListFilters, ShipmentListFilters } from "../ports";

const DEMO_CUSTOMER_ID = "nwc-001";

function toMinor(displayValue: string) {
  const parsed = Number(displayValue.replace(/[^0-9.]/g, ""));
  return Math.round(parsed * 100);
}

function mockShipmentActions(shipmentId: string): ShipmentAction[] {
  const linkedInvoice = invoices.find((invoice) => invoice.shipmentId === shipmentId);
  return [
    ...(linkedInvoice?.status === "unpaid" ? ["pay" as const] : []),
    "report_issue" as const,
    "duplicate" as const,
  ];
}

function mapShipment(input: (typeof shipments)[number]): ShipmentDto {
  return {
    id: input.id,
    customerId: DEMO_CUSTOMER_ID,
    trackingNumber: input.trackingNumber,
    carrier: input.carrier,
    transportMode: input.transportMode,
    packageName: input.packageName,
    origin: input.origin,
    destination: input.destination,
    etaAt: null,
    etaLabel: input.eta,
    status: input.status,
    statusLabel: input.statusLabel,
    price: { currency: "ZMW", amountMinor: toMinor(input.price) },
    imageUrl: input.image,
    progress: input.progress,
    nextAction: input.nextAction,
    events: input.events.map((event, index) => ({ id: `${input.id}-event-${index}`, label: event.label, detail: event.detail, occurredAt: null, displayTime: event.time, complete: event.complete, current: event.current })),
    allowedActions: mockShipmentActions(input.id),
    revision: 1,
  };
}

function mapInvoice(input: (typeof invoices)[number]): InvoiceDto {
  return {
    id: input.id,
    customerId: DEMO_CUSTOMER_ID,
    invoiceNumber: input.invoiceNumber,
    shipmentId: input.shipmentId ?? null,
    shipmentLabel: input.shipmentLabel,
    route: input.route,
    issuedAt: "2026-08-12T00:00:00.000Z",
    issuedAtLabel: input.issuedAt,
    dueAt: "2026-08-20T00:00:00.000Z",
    dueAtLabel: input.dueAt,
    status: input.status,
    total: { currency: input.currency, amountMinor: Math.round(input.amountValue * 100) },
    lineItems: input.lineItems.map((item) => ({ label: item.label, detail: item.detail, amount: { currency: input.currency, amountMinor: toMinor(item.amount) } })),
    paymentMethod: input.paymentMethod,
    paidAt: input.paidAt ? "2026-08-10T00:00:00.000Z" : null,
    paidAtLabel: input.paidAt,
    revision: 1,
  };
}

function mapAddress(input: (typeof addresses)[number]): AddressDto {
  return { id: input.id, customerId: DEMO_CUSTOMER_ID, label: input.label, line: input.line, landmark: input.landmark, isDefault: Boolean(input.default), revision: 1 };
}

function mapRecipient(input: (typeof recipients)[number]): RecipientDto {
  return { id: input.id, customerId: DEMO_CUSTOMER_ID, name: input.name, location: input.location, phone: input.phone, initials: input.initials, revision: 1 };
}

let mockAddresses = addresses.map(mapAddress);
let mockRecipients = recipients.map(mapRecipient);

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).map((part) => part[0]).slice(0, 2).join("").toUpperCase() || "C";
}

function ownsDemoRecords(scope: CustomerScope) {
  return scope.customerId === DEMO_CUSTOMER_ID;
}

export const mockCustomerPortalPort: CustomerPortalPort = {
  async listShipments(scope, filters: ShipmentListFilters = {}) {
    if (!ownsDemoRecords(scope)) return [];
    const needle = filters.query?.trim().toLowerCase() ?? "";
    return shipments
      .filter((shipment) => !needle || `${shipment.trackingNumber} ${shipment.packageName} ${shipment.destination}`.toLowerCase().includes(needle))
      .filter((shipment) => filters.status !== "active" || shipment.status !== "delivered")
      .filter((shipment) => filters.status !== "delivered" || shipment.status === "delivered")
      .map(mapShipment);
  },
  async getShipment(scope, shipmentId) {
    if (!ownsDemoRecords(scope)) return null;
    const shipment = shipments.find((item) => item.id === shipmentId);
    return shipment ? mapShipment(shipment) : null;
  },
  async getPublicTracking(trackingNumber) {
    const shipment = shipments.find((item) => item.trackingNumber.toLowerCase() === trackingNumber.toLowerCase());
    return shipment ? mapShipment(shipment) : null;
  },
  async listInvoices(scope, filters: InvoiceListFilters = {}) {
    if (!ownsDemoRecords(scope)) return [];
    return invoices.filter((invoice) => !filters.status || filters.status === "all" || invoice.status === filters.status).map(mapInvoice);
  },
  async getInvoice(scope, invoiceId) {
    if (!ownsDemoRecords(scope)) return null;
    const invoice = invoices.find((item) => item.id === invoiceId);
    return invoice ? mapInvoice(invoice) : null;
  },
  async listAddresses(scope) {
    return ownsDemoRecords(scope) ? mockAddresses : [];
  },
  async listRecipients(scope, query = "") {
    if (!ownsDemoRecords(scope)) return [];
    const needle = query.trim().toLowerCase();
    return mockRecipients.filter((recipient) => !needle || `${recipient.name} ${recipient.phone} ${recipient.location}`.toLowerCase().includes(needle));
  },
  async getReferenceData(): Promise<CustomerReferenceData> {
    return {
      offices: pickupOfficeSuggestions,
      deliveryOptions: deliveryOptions.map((option) => ({ ...option, price: { currency: "ZMW", amountMinor: toMinor(option.price) } })),
      transportOptions: cargoTransportOptions.map((option) => ({ ...option })),
    };
  },
  async createAddress(scope, input: AddressInput) {
    if (!ownsDemoRecords(scope)) throw new Error("Customer scope is not authorized for this record.");
    const record: AddressDto = { id: newId("address"), customerId: scope.customerId, label: input.label, line: input.line, landmark: input.landmark, isDefault: input.isDefault || !mockAddresses.length, revision: 1 };
    mockAddresses = record.isDefault ? [...mockAddresses.map((item) => ({ ...item, isDefault: false, revision: item.revision + 1 })), record] : [...mockAddresses, record];
    return record;
  },
  async updateAddress(scope, addressId, revision, input: AddressInput) {
    if (!ownsDemoRecords(scope)) throw new Error("Customer scope is not authorized for this record.");
    const current = mockAddresses.find((item) => item.id === addressId);
    if (!current || current.revision !== revision) throw new Error("Address was changed elsewhere. Refresh and try again.");
    const updated = { ...current, ...input, revision: current.revision + 1 };
    mockAddresses = mockAddresses.map((item) => item.id === addressId ? updated : input.isDefault ? { ...item, isDefault: false, revision: item.revision + 1 } : item);
    return updated;
  },
  async deleteAddress(scope, addressId, revision) {
    if (!ownsDemoRecords(scope)) throw new Error("Customer scope is not authorized for this record.");
    const current = mockAddresses.find((item) => item.id === addressId);
    if (!current || current.revision !== revision) throw new Error("Address was changed elsewhere. Refresh and try again.");
    mockAddresses = mockAddresses.filter((item) => item.id !== addressId);
  },
  async setDefaultAddress(scope, addressId, revision) {
    if (!ownsDemoRecords(scope)) throw new Error("Customer scope is not authorized for this record.");
    const current = mockAddresses.find((item) => item.id === addressId);
    if (!current || current.revision !== revision) throw new Error("Address was changed elsewhere. Refresh and try again.");
    const updated = { ...current, isDefault: true, revision: current.revision + 1 };
    mockAddresses = mockAddresses.map((item) => item.id === addressId ? updated : { ...item, isDefault: false, revision: item.isDefault ? item.revision + 1 : item.revision });
    return updated;
  },
  async createRecipient(scope, input: RecipientInput) {
    if (!ownsDemoRecords(scope)) throw new Error("Customer scope is not authorized for this record.");
    const record: RecipientDto = { id: newId("recipient"), customerId: scope.customerId, name: input.name, location: input.location, phone: input.phone, initials: initials(input.name), revision: 1 };
    mockRecipients = [...mockRecipients, record];
    return record;
  },
  async updateRecipient(scope, recipientId, revision, input: RecipientInput) {
    if (!ownsDemoRecords(scope)) throw new Error("Customer scope is not authorized for this record.");
    const current = mockRecipients.find((item) => item.id === recipientId);
    if (!current || current.revision !== revision) throw new Error("Recipient was changed elsewhere. Refresh and try again.");
    const updated = { ...current, ...input, initials: initials(input.name), revision: current.revision + 1 };
    mockRecipients = mockRecipients.map((item) => item.id === recipientId ? updated : item);
    return updated;
  },
  async deleteRecipient(scope, recipientId, revision) {
    if (!ownsDemoRecords(scope)) throw new Error("Customer scope is not authorized for this record.");
    const current = mockRecipients.find((item) => item.id === recipientId);
    if (!current || current.revision !== revision) throw new Error("Recipient was changed elsewhere. Refresh and try again.");
    mockRecipients = mockRecipients.filter((item) => item.id !== recipientId);
  },
  async performShipmentAction(scope, shipmentId, revision, action: ShipmentAction, _idempotencyKey) {
    const record = await this.getShipment(scope, shipmentId);
    if (!record || record.revision !== revision) throw new Error("Shipment was changed elsewhere. Refresh and try again.");
    return { ...record, allowedActions: record.allowedActions.filter((item) => item !== action), revision: record.revision + 1 };
  },
  async createPaymentIntent(scope, input: PaymentIntentInput): Promise<PaymentIntentDto> {
    if (!ownsDemoRecords(scope)) throw new Error("Customer scope is not authorized for this record.");
    return { id: newId("payment-intent"), status: "requires_action", providerReference: `demo-${input.method}`, revision: 1 };
  },
  async createFileUploadIntent(scope, input: FileUploadIntentInput): Promise<FileUploadIntentDto> {
    if (!ownsDemoRecords(scope)) throw new Error("Customer scope is not authorized for this record.");
    return { fileId: newId("file"), uploadUrl: `https://uploads.newworldcargo.test/${encodeURIComponent(input.filename)}`, headers: {}, expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() };
  },
};

export { DEMO_CUSTOMER_ID, ASSETS };
