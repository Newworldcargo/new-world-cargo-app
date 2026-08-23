import type { AddressDto, AddressInput, CustomerReferenceData, FileUploadIntentDto, FileUploadIntentInput, InvoiceDto, PaymentIntentDto, PaymentIntentInput, RecipientDto, RecipientInput, ShipmentAction, ShipmentDto } from "./contracts";

export type ShipmentListFilters = {
  query?: string;
  status?: "all" | "active" | "delivered";
};

export type InvoiceListFilters = { status?: "all" | "paid" | "unpaid" };

export type CustomerScope = { customerId: string };

export interface CustomerPortalPort {
  listShipments(scope: CustomerScope, filters?: ShipmentListFilters): Promise<ShipmentDto[]>;
  getShipment(scope: CustomerScope, shipmentId: string): Promise<ShipmentDto | null>;
  getPublicTracking(trackingNumber: string): Promise<ShipmentDto | null>;
  listInvoices(scope: CustomerScope, filters?: InvoiceListFilters): Promise<InvoiceDto[]>;
  getInvoice(scope: CustomerScope, invoiceId: string): Promise<InvoiceDto | null>;
  listAddresses(scope: CustomerScope): Promise<AddressDto[]>;
  listRecipients(scope: CustomerScope, query?: string): Promise<RecipientDto[]>;
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
}
