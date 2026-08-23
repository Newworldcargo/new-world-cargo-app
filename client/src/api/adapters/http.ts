import { apiRequest } from "../http";
import type { AddressDto, AddressInput, CustomerReferenceData, FileUploadIntentDto, FileUploadIntentInput, InvoiceDto, NotificationDto, PaymentIntentDto, PaymentIntentInput, PickupDto, PickupInput, RecipientDto, RecipientInput, ReturnRequestDto, ReturnRequestInput, SessionActivityDto, ShipmentAction, ShipmentDto, SupportCaseDto, SupportCaseInput, UploadedFileDto, WalletDto } from "../contracts";
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
  async getWallet() {
    return apiRequest<WalletDto | null>("/wallet");
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
  async completeFileUpload(_scope, fileId) {
    return apiRequest<UploadedFileDto>(`/files/${encodeURIComponent(fileId)}/complete`, { method: "POST" });
  },
  async listNotifications() {
    return apiRequest<NotificationDto[]>("/notifications");
  },
  async markNotificationRead(_scope, notificationId, revision) {
    return apiRequest<NotificationDto>(`/notifications/${encodeURIComponent(notificationId)}/read`, { method: "PATCH", headers: { "If-Match": String(revision) } });
  },
  async markAllNotificationsRead(_scope, idempotencyKey) {
    await apiRequest<void>("/notifications/read-all", { method: "POST", headers: { "Idempotency-Key": idempotencyKey } });
  },
  async listSupportCases() { return apiRequest<SupportCaseDto[]>("/support/cases"); },
  async createSupportCase(_scope, input) { return apiRequest<SupportCaseDto>("/support/cases", { method: "POST", headers: { "Idempotency-Key": input.idempotencyKey }, body: input }); },
  async listReturnRequests() { return apiRequest<ReturnRequestDto[]>("/returns"); },
  async createReturnRequest(_scope, input) { return apiRequest<ReturnRequestDto>("/returns", { method: "POST", headers: { "Idempotency-Key": input.idempotencyKey }, body: input }); },
  async getPickup() { return apiRequest<PickupDto | null>("/pickups/current"); },
  async schedulePickup(_scope, input) { return apiRequest<PickupDto>("/pickups", { method: "POST", headers: { "Idempotency-Key": input.idempotencyKey }, body: input }); },
  async cancelPickup(_scope, pickupId, revision, idempotencyKey) { return apiRequest<PickupDto>(`/pickups/${encodeURIComponent(pickupId)}/cancel`, { method: "POST", headers: { "If-Match": String(revision), "Idempotency-Key": idempotencyKey } }); },
  async listSessionActivity() { return apiRequest<SessionActivityDto[]>("/security/sessions"); },
  async setSessionTrust(_scope, sessionId, revision, trusted) { return apiRequest<SessionActivityDto>(`/security/sessions/${encodeURIComponent(sessionId)}/trust`, { method: "PATCH", headers: { "If-Match": String(revision) }, body: { trusted } }); },
  async revokeSession(_scope, sessionId, revision, idempotencyKey) { await apiRequest<void>(`/security/sessions/${encodeURIComponent(sessionId)}`, { method: "DELETE", headers: { "If-Match": String(revision), "Idempotency-Key": idempotencyKey } }); },
};
