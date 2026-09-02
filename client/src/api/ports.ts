import type { AddressDto, AddressInput, CustomerReferenceData, FileUploadIntentDto, FileUploadIntentInput, InvoiceDto, NotificationDto, PaymentIntentDto, PaymentIntentInput, PickupDto, PickupInput, RecipientDto, RecipientInput, ReturnRequestDto, ReturnRequestInput, SessionActivityDto, ShipmentAction, ShipmentDto, ShipmentDraftDto, ShipmentDraftInput, SupportCaseDto, SupportCaseInput, UploadedFileDto, WalletDto } from "./contracts";

export type ShipmentListFilters = {
  query?: string;
  status?: "all" | "active" | "delivered";
};

export type InvoiceListFilters = { query?: string; status?: "all" | "paid" | "unpaid" };

export type CustomerScope = { customerId: string };

export interface CustomerPortalPort {
  listShipments(scope: CustomerScope, filters?: ShipmentListFilters): Promise<ShipmentDto[]>;
  getShipment(scope: CustomerScope, shipmentId: string): Promise<ShipmentDto | null>;
  getPublicTracking(trackingNumber: string): Promise<ShipmentDto | null>;
  listInvoices(scope: CustomerScope, filters?: InvoiceListFilters): Promise<InvoiceDto[]>;
  getInvoice(scope: CustomerScope, invoiceId: string): Promise<InvoiceDto | null>;
  getWallet(scope: CustomerScope): Promise<WalletDto | null>;
  listAddresses(scope: CustomerScope): Promise<AddressDto[]>;
  listRecipients(scope: CustomerScope, query?: string): Promise<RecipientDto[]>;
  listShipmentDrafts(scope: CustomerScope): Promise<ShipmentDraftDto[]>;
  createShipmentDraft(scope: CustomerScope, input: ShipmentDraftInput): Promise<ShipmentDraftDto>;
  submitShipmentDraft(scope: CustomerScope, draftId: string, revision: number): Promise<ShipmentDto>;
  deleteShipmentDraft(scope: CustomerScope, draftId: string, revision: number): Promise<void>;
  getReferenceData(): Promise<CustomerReferenceData>;
  createAddress(scope: CustomerScope, input: AddressInput): Promise<AddressDto>;
  updateAddress(scope: CustomerScope, addressId: string, revision: number, input: AddressInput): Promise<AddressDto>;
  deleteAddress(scope: CustomerScope, addressId: string, revision: number): Promise<void>;
  setDefaultAddress(scope: CustomerScope, addressId: string, revision: number): Promise<AddressDto>;
  createRecipient(scope: CustomerScope, input: RecipientInput): Promise<RecipientDto>;
  updateRecipient(scope: CustomerScope, recipientId: string, revision: number, input: RecipientInput): Promise<RecipientDto>;
  deleteRecipient(scope: CustomerScope, recipientId: string, revision: number): Promise<void>;
  performShipmentAction(scope: CustomerScope, shipmentId: string, revision: number, action: ShipmentAction, idempotencyKey: string): Promise<ShipmentDto>;
  createPaymentIntent(scope: CustomerScope, input: PaymentIntentInput): Promise<PaymentIntentDto>;
  createFileUploadIntent(scope: CustomerScope, input: FileUploadIntentInput): Promise<FileUploadIntentDto>;
  completeFileUpload(scope: CustomerScope, fileId: string): Promise<UploadedFileDto>;
  listNotifications(scope: CustomerScope): Promise<NotificationDto[]>;
  markNotificationRead(scope: CustomerScope, notificationId: string, revision: number): Promise<NotificationDto>;
  markAllNotificationsRead(scope: CustomerScope, idempotencyKey: string): Promise<void>;
  listSupportCases(scope: CustomerScope): Promise<SupportCaseDto[]>;
  createSupportCase(scope: CustomerScope, input: SupportCaseInput): Promise<SupportCaseDto>;
  listReturnRequests(scope: CustomerScope): Promise<ReturnRequestDto[]>;
  createReturnRequest(scope: CustomerScope, input: ReturnRequestInput): Promise<ReturnRequestDto>;
  getPickup(scope: CustomerScope): Promise<PickupDto | null>;
  schedulePickup(scope: CustomerScope, input: PickupInput): Promise<PickupDto>;
  cancelPickup(scope: CustomerScope, pickupId: string, revision: number, idempotencyKey: string): Promise<PickupDto>;
  listSessionActivity(scope: CustomerScope): Promise<SessionActivityDto[]>;
  setSessionTrust(scope: CustomerScope, sessionId: string, revision: number, trusted: boolean): Promise<SessionActivityDto>;
  revokeSession(scope: CustomerScope, sessionId: string, revision: number, idempotencyKey: string): Promise<void>;
}
