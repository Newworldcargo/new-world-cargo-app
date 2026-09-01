import {
  ASSETS,
  addresses,
  cargoTransportOptions,
  deliveryOptions,
  invoices,
  pickupOfficeSuggestions,
  recipients,
  shipments,
} from "@/lib/mock-data";
import type {
  AddressDto,
  AddressInput,
  CustomerReferenceData,
  FileUploadIntentDto,
  FileUploadIntentInput,
  InvoiceDto,
  NotificationDto,
  PaymentIntentDto,
  PaymentIntentInput,
  PickupDto,
  PickupInput,
  RecipientDto,
  RecipientInput,
  ReturnRequestDto,
  ReturnRequestInput,
  SessionActivityDto,
  ShipmentAction,
  ShipmentDto,
  ShipmentDraftDto,
  ShipmentDraftInput,
  SupportCaseDto,
  SupportCaseInput,
  UploadedFileDto,
  WalletDto,
} from "../contracts";
import type {
  CustomerPortalPort,
  CustomerScope,
  InvoiceListFilters,
  ShipmentListFilters,
} from "../ports";

const DEMO_CUSTOMER_ID = "nwc-001";

function toMinor(displayValue: string) {
  const parsed = Number(displayValue.replace(/[^0-9.]/g, ""));
  return Math.round(parsed * 100);
}

function mockShipmentActions(shipmentId: string): ShipmentAction[] {
  const linkedInvoice = invoices.find(
    invoice => invoice.shipmentId === shipmentId
  );
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
    events: input.events.map((event, index) => ({
      id: `${input.id}-event-${index}`,
      label: event.label,
      detail: event.detail,
      occurredAt: null,
      displayTime: event.time,
      complete: event.complete,
      current: event.current,
    })),
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
    total: {
      currency: input.currency,
      amountMinor: Math.round(input.amountValue * 100),
    },
    lineItems: input.lineItems.map(item => ({
      label: item.label,
      detail: item.detail,
      amount: { currency: input.currency, amountMinor: toMinor(item.amount) },
    })),
    paymentMethod: input.paymentMethod,
    paidAt: input.paidAt ? "2026-08-10T00:00:00.000Z" : null,
    paidAtLabel: input.paidAt,
    revision: 1,
  };
}

function mapAddress(input: (typeof addresses)[number]): AddressDto {
  return {
    id: input.id,
    customerId: DEMO_CUSTOMER_ID,
    label: input.label,
    line: input.line,
    landmark: input.landmark,
    isDefault: Boolean(input.default),
    revision: 1,
  };
}

function mapRecipient(input: (typeof recipients)[number]): RecipientDto {
  return {
    id: input.id,
    name: input.name,
    address: input.location,
    phone: input.phone,
    revision: 1,
  };
}

let mockAddresses = addresses.map(mapAddress);
let mockRecipients = recipients.map(mapRecipient);
let mockDrafts: ShipmentDraftDto[] = [];
let mockNotifications: NotificationDto[] = [
  {
    id: "notification-1",
    customerId: DEMO_CUSTOMER_ID,
    type: "progress",
    title: "Your package is in transit",
    body: "NWC48291ZM is moving through our delivery network.",
    occurredAt: "2026-08-23T07:35:00.000Z",
    displayTime: "12 min ago",
    shipmentId: "shipment-48291",
    unread: true,
    revision: 1,
  },
  {
    id: "notification-2",
    customerId: DEMO_CUSTOMER_ID,
    type: "arrival",
    title: "Courier is nearby",
    body: "NWC19034ZM is arriving today in Ndola.",
    occurredAt: "2026-08-23T06:47:00.000Z",
    displayTime: "1 hr ago",
    shipmentId: "shipment-19034",
    unread: true,
    revision: 1,
  },
  {
    id: "notification-3",
    customerId: DEMO_CUSTOMER_ID,
    type: "exception",
    title: "Delivery needs your attention",
    body: "We couldn't reach the recipient for NWC77120ZM.",
    occurredAt: "2026-08-22T12:00:00.000Z",
    displayTime: "Yesterday",
    shipmentId: "shipment-77120",
    unread: false,
    revision: 1,
  },
  {
    id: "notification-4",
    customerId: DEMO_CUSTOMER_ID,
    type: "payment",
    title: "Payment confirmed",
    body: "Your receipt for NWC48291ZM is ready to view.",
    occurredAt: "2026-08-12T12:00:00.000Z",
    displayTime: "12 Aug",
    shipmentId: "shipment-48291",
    unread: false,
    revision: 1,
  },
];
let mockSupportCases: SupportCaseDto[] = [
  {
    id: "NWC-CASE-1048",
    customerId: DEMO_CUSTOMER_ID,
    category: "Delivery question",
    subject: "Delivery time for NWC19034ZM",
    detail: "Please confirm the expected delivery window.",
    status: "in_review",
    createdAt: "2026-08-23T07:00:00.000Z",
    displayCreatedAt: "Today",
    attachmentFileId: null,
    revision: 1,
  },
];
let mockReturnRequests: ReturnRequestDto[] = [];
let mockPickup: PickupDto = {
  id: "pickup-current",
  customerId: DEMO_CUSTOMER_ID,
  shipmentId: null,
  status: "requested",
  collectionPoint: "New World Cargo Lusaka office",
  scheduledDate: null,
  scheduledTime: null,
  revision: 1,
};
let mockSessions: SessionActivityDto[] = [
  {
    id: "session-current",
    customerId: DEMO_CUSTOMER_ID,
    device: "This device",
    location: "Lusaka, Zambia",
    lastActiveAt: "2026-08-23T07:50:00.000Z",
    displayLastActiveAt: "Active now",
    current: true,
    trusted: true,
    revision: 1,
  },
  {
    id: "session-previous",
    customerId: DEMO_CUSTOMER_ID,
    device: "Chrome on Windows",
    location: "Lusaka, Zambia",
    lastActiveAt: "2026-08-21T11:00:00.000Z",
    displayLastActiveAt: "2 days ago",
    current: false,
    trusted: false,
    revision: 1,
  },
];
const mockWallet: WalletDto = {
  id: "wallet-nwc-001",
  customerId: DEMO_CUSTOMER_ID,
  currency: "ZMW",
  availableBalance: { currency: "ZMW", amountMinor: 0 },
  pendingBalance: { currency: "ZMW", amountMinor: 0 },
  status: "active",
  updatedAt: "2026-08-23T08:00:00.000Z",
  revision: 1,
};

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function ownsDemoRecords(scope: CustomerScope) {
  return scope.customerId === DEMO_CUSTOMER_ID;
}

export const mockCustomerPortalPort: CustomerPortalPort = {
  async listShipments(scope, filters: ShipmentListFilters = {}) {
    if (!ownsDemoRecords(scope)) return [];
    const needle = filters.query?.trim().toLowerCase() ?? "";
    return shipments
      .filter(
        shipment =>
          !needle ||
          `${shipment.trackingNumber} ${shipment.packageName} ${shipment.destination}`
            .toLowerCase()
            .includes(needle)
      )
      .filter(
        shipment =>
          filters.status !== "active" || shipment.status !== "delivered"
      )
      .filter(
        shipment =>
          filters.status !== "delivered" || shipment.status === "delivered"
      )
      .map(mapShipment);
  },
  async getShipment(scope, shipmentId) {
    if (!ownsDemoRecords(scope)) return null;
    const shipment = shipments.find(item => item.id === shipmentId);
    return shipment ? mapShipment(shipment) : null;
  },
  async getPublicTracking(trackingNumber) {
    const shipment = shipments.find(
      item => item.trackingNumber.toLowerCase() === trackingNumber.toLowerCase()
    );
    return shipment ? mapShipment(shipment) : null;
  },
  async listInvoices(scope, filters: InvoiceListFilters = {}) {
    if (!ownsDemoRecords(scope)) return [];
    return invoices
      .filter(
        invoice =>
          !filters.status ||
          filters.status === "all" ||
          invoice.status === filters.status
      )
      .map(mapInvoice);
  },
  async getInvoice(scope, invoiceId) {
    if (!ownsDemoRecords(scope)) return null;
    const invoice = invoices.find(item => item.id === invoiceId);
    return invoice ? mapInvoice(invoice) : null;
  },
  async getWallet(scope) {
    return ownsDemoRecords(scope) ? mockWallet : null;
  },
  async listAddresses(scope) {
    return ownsDemoRecords(scope) ? mockAddresses : [];
  },
  async listRecipients(scope, query = "") {
    if (!ownsDemoRecords(scope)) return [];
    const needle = query.trim().toLowerCase();
    return mockRecipients.filter(
      recipient =>
        !needle ||
        `${recipient.name} ${recipient.phone} ${recipient.address}`
          .toLowerCase()
          .includes(needle)
    );
  },
  async listShipmentDrafts(scope) {
    return ownsDemoRecords(scope) ? mockDrafts : [];
  },
  async createShipmentDraft(scope, input: ShipmentDraftInput) {
    if (!ownsDemoRecords(scope))
      throw new Error("Customer scope is not authorized for this record.");
    const now = new Date().toISOString();
    const draft: ShipmentDraftDto = {
      id: newId("draft"),
      customerId: scope.customerId,
      status: "draft",
      payload: input.payload,
      quoteId: null,
      shipmentId: null,
      expiresAt: input.expiresAt ?? null,
      revision: 1,
      createdAt: now,
      updatedAt: now,
    };
    mockDrafts = [draft, ...mockDrafts];
    return draft;
  },
  async deleteShipmentDraft(scope, draftId, revision) {
    if (!ownsDemoRecords(scope))
      throw new Error("Customer scope is not authorized for this record.");
    const current = mockDrafts.find(draft => draft.id === draftId);
    if (!current || current.revision !== revision)
      throw new Error("Draft was changed elsewhere. Refresh and try again.");
    mockDrafts = mockDrafts.filter(draft => draft.id !== draftId);
  },
  async getReferenceData(): Promise<CustomerReferenceData> {
    return {
      offices: pickupOfficeSuggestions,
      deliveryOptions: deliveryOptions.map(option => ({
        ...option,
        price: { currency: "ZMW", amountMinor: toMinor(option.price) },
      })),
      transportOptions: cargoTransportOptions.map(option => ({ ...option })),
    };
  },
  async createAddress(scope, input: AddressInput) {
    if (!ownsDemoRecords(scope))
      throw new Error("Customer scope is not authorized for this record.");
    const record: AddressDto = {
      id: newId("address"),
      customerId: scope.customerId,
      label: input.label,
      line: input.line,
      landmark: input.landmark,
      isDefault: input.isDefault || !mockAddresses.length,
      revision: 1,
    };
    mockAddresses = record.isDefault
      ? [
          ...mockAddresses.map(item => ({
            ...item,
            isDefault: false,
            revision: item.revision + 1,
          })),
          record,
        ]
      : [...mockAddresses, record];
    return record;
  },
  async updateAddress(scope, addressId, revision, input: AddressInput) {
    if (!ownsDemoRecords(scope))
      throw new Error("Customer scope is not authorized for this record.");
    const current = mockAddresses.find(item => item.id === addressId);
    if (!current || current.revision !== revision)
      throw new Error("Address was changed elsewhere. Refresh and try again.");
    const updated = { ...current, ...input, revision: current.revision + 1 };
    mockAddresses = mockAddresses.map(item =>
      item.id === addressId
        ? updated
        : input.isDefault
          ? { ...item, isDefault: false, revision: item.revision + 1 }
          : item
    );
    return updated;
  },
  async deleteAddress(scope, addressId, revision) {
    if (!ownsDemoRecords(scope))
      throw new Error("Customer scope is not authorized for this record.");
    const current = mockAddresses.find(item => item.id === addressId);
    if (!current || current.revision !== revision)
      throw new Error("Address was changed elsewhere. Refresh and try again.");
    mockAddresses = mockAddresses.filter(item => item.id !== addressId);
  },
  async setDefaultAddress(scope, addressId, revision) {
    if (!ownsDemoRecords(scope))
      throw new Error("Customer scope is not authorized for this record.");
    const current = mockAddresses.find(item => item.id === addressId);
    if (!current || current.revision !== revision)
      throw new Error("Address was changed elsewhere. Refresh and try again.");
    const updated = {
      ...current,
      isDefault: true,
      revision: current.revision + 1,
    };
    mockAddresses = mockAddresses.map(item =>
      item.id === addressId
        ? updated
        : {
            ...item,
            isDefault: false,
            revision: item.isDefault ? item.revision + 1 : item.revision,
          }
    );
    return updated;
  },
  async createRecipient(scope, input: RecipientInput) {
    if (!ownsDemoRecords(scope))
      throw new Error("Customer scope is not authorized for this record.");
    const record: RecipientDto = {
      id: newId("recipient"),
      name: input.name,
      address: input.address,
      phone: input.phone,
      revision: 1,
    };
    mockRecipients = [...mockRecipients, record];
    return record;
  },
  async updateRecipient(scope, recipientId, revision, input: RecipientInput) {
    if (!ownsDemoRecords(scope))
      throw new Error("Customer scope is not authorized for this record.");
    const current = mockRecipients.find(item => item.id === recipientId);
    if (!current || current.revision !== revision)
      throw new Error(
        "Recipient was changed elsewhere. Refresh and try again."
      );
    const updated = { ...current, ...input, revision: current.revision + 1 };
    mockRecipients = mockRecipients.map(item =>
      item.id === recipientId ? updated : item
    );
    return updated;
  },
  async deleteRecipient(scope, recipientId, revision) {
    if (!ownsDemoRecords(scope))
      throw new Error("Customer scope is not authorized for this record.");
    const current = mockRecipients.find(item => item.id === recipientId);
    if (!current || current.revision !== revision)
      throw new Error(
        "Recipient was changed elsewhere. Refresh and try again."
      );
    mockRecipients = mockRecipients.filter(item => item.id !== recipientId);
  },
  async performShipmentAction(
    scope,
    shipmentId,
    revision,
    action: ShipmentAction,
    _idempotencyKey
  ) {
    const record = await this.getShipment(scope, shipmentId);
    if (!record || record.revision !== revision)
      throw new Error("Shipment was changed elsewhere. Refresh and try again.");
    return {
      ...record,
      allowedActions: record.allowedActions.filter(item => item !== action),
      revision: record.revision + 1,
    };
  },
  async createPaymentIntent(
    scope,
    input: PaymentIntentInput
  ): Promise<PaymentIntentDto> {
    if (!ownsDemoRecords(scope))
      throw new Error("Customer scope is not authorized for this record.");
    return {
      id: newId("payment-intent"),
      status: "requires_action",
      providerReference: `demo-${input.method}`,
      revision: 1,
    };
  },
  async createFileUploadIntent(
    scope,
    input: FileUploadIntentInput
  ): Promise<FileUploadIntentDto> {
    if (!ownsDemoRecords(scope))
      throw new Error("Customer scope is not authorized for this record.");
    return {
      fileId: newId("file"),
      uploadUrl: `https://uploads.newworldcargo.test/${encodeURIComponent(input.filename)}`,
      headers: {},
      requiresPortalAuth: false,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    };
  },
  async completeFileUpload(scope, fileId): Promise<UploadedFileDto> {
    if (!ownsDemoRecords(scope))
      throw new Error("Customer scope is not authorized for this record.");
    return {
      fileId,
      url: "https://placehold.co/256x256/png?text=NWC",
      contentType: "image/png",
      sizeBytes: 1,
    };
  },
  async listNotifications(scope) {
    return ownsDemoRecords(scope) ? mockNotifications : [];
  },
  async markNotificationRead(scope, notificationId, revision) {
    if (!ownsDemoRecords(scope))
      throw new Error("Customer scope is not authorized for this record.");
    const current = mockNotifications.find(item => item.id === notificationId);
    if (!current || current.revision !== revision)
      throw new Error(
        "Notification was changed elsewhere. Refresh and try again."
      );
    const updated = {
      ...current,
      unread: false,
      revision: current.revision + 1,
    };
    mockNotifications = mockNotifications.map(item =>
      item.id === notificationId ? updated : item
    );
    return updated;
  },
  async markAllNotificationsRead(scope, _idempotencyKey) {
    if (!ownsDemoRecords(scope))
      throw new Error("Customer scope is not authorized for this record.");
    mockNotifications = mockNotifications.map(item =>
      item.unread
        ? { ...item, unread: false, revision: item.revision + 1 }
        : item
    );
  },
  async listSupportCases(scope) {
    return ownsDemoRecords(scope) ? mockSupportCases : [];
  },
  async createSupportCase(scope, input: SupportCaseInput) {
    if (!ownsDemoRecords(scope))
      throw new Error("Customer scope is not authorized for this record.");
    const record: SupportCaseDto = {
      id: `NWC-CASE-${1049 + mockSupportCases.length}`,
      customerId: scope.customerId,
      category: input.category,
      subject: input.subject,
      detail: input.detail,
      status: "open",
      createdAt: new Date().toISOString(),
      displayCreatedAt: "Just now",
      attachmentFileId: input.attachmentFileId,
      revision: 1,
    };
    mockSupportCases = [record, ...mockSupportCases];
    return record;
  },
  async listReturnRequests(scope) {
    return ownsDemoRecords(scope) ? mockReturnRequests : [];
  },
  async createReturnRequest(scope, input: ReturnRequestInput) {
    if (!ownsDemoRecords(scope))
      throw new Error("Customer scope is not authorized for this record.");
    const shipment = await this.getShipment(scope, input.shipmentId);
    if (!shipment) throw new Error("Shipment was not found for this customer.");
    const record: ReturnRequestDto = {
      id: newId("return"),
      customerId: scope.customerId,
      shipmentId: shipment.id,
      trackingNumber: shipment.trackingNumber,
      reason: input.reason,
      handover: input.handover,
      status: "requested",
      displayStatus: "Request received",
      createdAt: new Date().toISOString(),
      revision: 1,
    };
    mockReturnRequests = [record, ...mockReturnRequests];
    return record;
  },
  async getPickup(scope) {
    return ownsDemoRecords(scope) ? mockPickup : null;
  },
  async schedulePickup(scope, input: PickupInput) {
    if (!ownsDemoRecords(scope))
      throw new Error("Customer scope is not authorized for this record.");
    mockPickup = {
      ...mockPickup,
      shipmentId: input.shipmentId,
      collectionPoint: input.collectionPoint,
      status: "requested",
      scheduledDate: input.scheduledDate,
      scheduledTime: input.scheduledTime,
      revision: mockPickup.revision + 1,
    };
    return mockPickup;
  },
  async cancelPickup(scope, pickupId, revision, _idempotencyKey) {
    if (
      !ownsDemoRecords(scope) ||
      mockPickup.id !== pickupId ||
      mockPickup.revision !== revision
    )
      throw new Error("Pickup was changed elsewhere. Refresh and try again.");
    mockPickup = {
      ...mockPickup,
      status: "cancelled",
      revision: mockPickup.revision + 1,
    };
    return mockPickup;
  },
  async listSessionActivity(scope) {
    return ownsDemoRecords(scope) ? mockSessions : [];
  },
  async setSessionTrust(scope, sessionId, revision, trusted) {
    if (!ownsDemoRecords(scope))
      throw new Error("Customer scope is not authorized for this record.");
    const current = mockSessions.find(session => session.id === sessionId);
    if (!current || current.revision !== revision)
      throw new Error("Session was changed elsewhere. Refresh and try again.");
    const updated = { ...current, trusted, revision: current.revision + 1 };
    mockSessions = mockSessions.map(session =>
      session.id === sessionId ? updated : session
    );
    return updated;
  },
  async revokeSession(scope, sessionId, revision, _idempotencyKey) {
    if (!ownsDemoRecords(scope))
      throw new Error("Customer scope is not authorized for this record.");
    const current = mockSessions.find(session => session.id === sessionId);
    if (!current || current.revision !== revision)
      throw new Error("Session was changed elsewhere. Refresh and try again.");
    mockSessions = mockSessions.filter(session => session.id !== sessionId);
  },
};

export { DEMO_CUSTOMER_ID, ASSETS };
