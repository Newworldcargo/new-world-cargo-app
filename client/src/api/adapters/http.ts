import { apiRequest } from "../http";
import type { AddressDto, AddressInput, CustomerReferenceData, FileUploadIntentDto, FileUploadIntentInput, InvoiceDto, PaymentIntentDto, PaymentIntentInput, RecipientDto, RecipientInput, ShipmentAction, ShipmentDto } from "../contracts";
import type { CustomerPortalPort, CustomerScope, InvoiceListFilters, ShipmentListFilters } from "../ports";

function queryString(params: Record<string, string | undefined>) {
  const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined) as [string, string][]);
  return query.size ? `?${query.toString()}` : "";
}

export const httpCustomerPortalPort: CustomerPortalPort = {
  async listShipments(_scope: CustomerScope, filters: ShipmentListFilters = {}) {
    return apiRequest<ShipmentDto[]>(`/shipments${queryString({ q: filters.query, status: filters.status === "all" ? undefined : filters.status })}`);
  },
  async getShipment(_scope, shipmentId) {
    return apiRequest<ShipmentDto | null>(`/shipments/${encodeURIComponent(shipmentId)}`);
  },
  async getPublicTracking(trackingNumber) {
    return apiRequest<ShipmentDto | null>(`/public/tracking/${encodeURIComponent(trackingNumber)}`);
  },
  async listInvoices(_scope, filters: InvoiceListFilters = {}) {
    return apiRequest<InvoiceDto[]>(`/invoices${queryString({ status: filters.status === "all" ? undefined : filters.status })}`);
  },
  async getInvoice(_scope, invoiceId) {
    return apiRequest<InvoiceDto | null>(`/invoices/${encodeURIComponent(invoiceId)}`);
  },
  async listAddresses() {
    return apiRequest<AddressDto[]>("/addresses");
  },
  async listRecipients(_scope, query = "") {
    return apiRequest<RecipientDto[]>(`/recipients${queryString({ q: query || undefined })}`);
  },
  async getReferenceData() {
    return apiRequest<CustomerReferenceData>("/reference-data");
  },
  async createAddress(_scope, input) {
    return apiRequest<AddressDto>("/addresses", { method: "POST", body: input });
  },
  async updateAddress(_scope, addressId, revision, input) {
    return apiRequest<AddressDto>(`/addresses/${encodeURIComponent(addressId)}`, { method: "PUT", headers: { "If-Match": String(revision) }, body: input });
  },
  async deleteAddress(_scope, addressId, revision) {
    await apiRequest<void>(`/addresses/${encodeURIComponent(addressId)}`, { method: "DELETE", headers: { "If-Match": String(revision) } });
  },
  async setDefaultAddress(_scope, addressId, revision) {
    return apiRequest<AddressDto>(`/addresses/${encodeURIComponent(addressId)}/default`, { method: "PATCH", headers: { "If-Match": String(revision) } });
  },
  async createRecipient(_scope, input) {
    return apiRequest<RecipientDto>("/recipients", { method: "POST", body: input });
  },
  async updateRecipient(_scope, recipientId, revision, input) {
    return apiRequest<RecipientDto>(`/recipients/${encodeURIComponent(recipientId)}`, { method: "PUT", headers: { "If-Match": String(revision) }, body: input });
  },
  async deleteRecipient(_scope, recipientId, revision) {
    await apiRequest<void>(`/recipients/${encodeURIComponent(recipientId)}`, { method: "DELETE", headers: { "If-Match": String(revision) } });
  },
  async performShipmentAction(_scope, shipmentId, revision, action, idempotencyKey) {
    return apiRequest<ShipmentDto>(`/shipments/${encodeURIComponent(shipmentId)}/actions`, { method: "POST", headers: { "Idempotency-Key": idempotencyKey, "If-Match": String(revision) }, body: { action } });
  },
  async createPaymentIntent(_scope, input) {
    return apiRequest<PaymentIntentDto>("/payments/intents", { method: "POST", headers: { "Idempotency-Key": input.idempotencyKey }, body: input });
  },
  async createFileUploadIntent(_scope, input) {
    return apiRequest<FileUploadIntentDto>("/files/upload-intents", { method: "POST", headers: { "Idempotency-Key": input.idempotencyKey }, body: input });
  },
};
