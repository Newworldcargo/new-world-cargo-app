import { apiProblemSchema, shipmentDtoSchema, type AddressDto, type AddressInput, type CustomerReferenceData, type FileUploadIntentDto, type FileUploadIntentInput, type InvoiceDto, type NotificationDto, type PaymentIntentDto, type PaymentIntentInput, type PickupDto, type PickupInput, type RecipientDto, type RecipientInput, type ReturnRequestDto, type ReturnRequestInput, type SessionActivityDto, type ShipmentAction, type ShipmentDto, type ShipmentDraftDto, type SupportCaseDto, type SupportCaseInput, type UploadedFileDto, type WalletDto } from "../contracts";
import { CustomerApiError } from "../errors";
import { apiRequest, apiRequestTimeoutMs } from "../http";
import type { CustomerPortalPort, CustomerScope, InvoiceListFilters, ShipmentListFilters } from "../ports";

const publicTrackingBaseUrl = "https://admin.newworldcargo.com/api/v1/public/tracking";

function queryString(params: Record<string, string | undefined>) {
  const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined) as [string, string][]);
  return query.size ? `?${query.toString()}` : "";
}

export function parsePublicTrackingPayload(payload: unknown): ShipmentDto | null {
  if (payload === null) return null;
  if (typeof payload === "object" && payload !== null && Object.keys(payload as Record<string, unknown>).length === 0) return null;

  const responseData = payload && typeof payload === "object" && "data" in payload
    ? (payload as { data: unknown }).data
    : payload;
  if (!responseData || typeof responseData !== "object") return null;

  const shipment = responseData as Record<string, unknown>;
  const normalizeDate = (value: unknown) => {
    if (typeof value !== "string") return value;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toISOString();
  };
  const normalized = {
    ...shipment,
    customerId: shipment.customerId ?? "public",
    carrier: shipment.carrier ?? "New World Cargo",
    packageName: shipment.packageName ?? "Shipment",
    price: shipment.price ?? { currency: "USD", amountMinor: 0 },
    imageUrl: shipment.imageUrl ?? undefined,
    nextAction: shipment.nextAction ?? undefined,
    allowedActions: shipment.allowedActions ?? [],
    etaAt: normalizeDate(shipment.etaAt),
    events: Array.isArray(shipment.events)
      ? shipment.events.map((event) => ({ ...event as Record<string, unknown>, occurredAt: normalizeDate((event as Record<string, unknown>).occurredAt) }))
      : shipment.events,
  };
  const parsedShipment = shipmentDtoSchema.safeParse(normalized);
  if (!parsedShipment.success) {
    throw new CustomerApiError(502, { error: { code: "INVALID_TRACKING_PAYLOAD", message: "Tracking data is not in the expected format.", retryable: true } });
  }

  return parsedShipment.data;
}

async function fetchPublicTracking(trackingNumber: string): Promise<ShipmentDto | null> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), apiRequestTimeoutMs);

  try {
    const response = await fetch(`${publicTrackingBaseUrl}/${encodeURIComponent(trackingNumber)}`, {
      method: "GET",
      signal: controller.signal,
      credentials: "omit",
      headers: {
        Accept: "application/json",
      },
    });

    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      const parsedProblem = apiProblemSchema.safeParse(payload);
      throw new CustomerApiError(
        response.status,
        parsedProblem.success
          ? parsedProblem.data
          : { error: { code: String(response.status), message: "We could not load tracking right now.", retryable: response.status >= 500 } },
      );
    }

    return parsePublicTrackingPayload(payload);
  } catch (error) {
    if (controller.signal.aborted) {
      throw new CustomerApiError(408, { error: { code: "REQUEST_TIMEOUT", message: "The request took too long. Please try again.", retryable: true } });
    }
    if (error instanceof CustomerApiError) throw error;
    throw new CustomerApiError(503, { error: { code: "NETWORK_UNAVAILABLE", message: "We could not reach New World Cargo. Please check your connection and try again.", retryable: true } });
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

export const httpCustomerPortalPort: CustomerPortalPort = {
  async listShipments(_scope: CustomerScope, filters: ShipmentListFilters = {}) {
    return apiRequest<ShipmentDto[]>(`/shipments${queryString({ q: filters.query, status: filters.status === "all" ? undefined : filters.status })}`);
  },
  async getShipment(_scope, shipmentId) {
    return apiRequest<ShipmentDto | null>(`/shipments/${encodeURIComponent(shipmentId)}`);
  },
  async getPublicTracking(trackingNumber) {
    return fetchPublicTracking(trackingNumber);
  },
  async listInvoices(_scope, filters: InvoiceListFilters = {}) {
    return apiRequest<InvoiceDto[]>(`/invoices${queryString({ q: filters.query?.trim() || undefined, status: filters.status === "all" ? undefined : filters.status })}`);
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
  async listShipmentDrafts() {
    return apiRequest<ShipmentDraftDto[]>("/shipment-drafts");
  },
  async createShipmentDraft(_scope, input) {
    return apiRequest<ShipmentDraftDto>("/shipment-drafts", { method: "POST", headers: { "Idempotency-Key": crypto.randomUUID() }, body: input });
  },
  async deleteShipmentDraft(_scope, draftId, revision) {
    await apiRequest<void>(`/shipment-drafts/${encodeURIComponent(draftId)}`, { method: "DELETE", headers: { "If-Match": String(revision), "Idempotency-Key": crypto.randomUUID() } });
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
    return apiRequest<RecipientDto>(`/recipients/${encodeURIComponent(recipientId)}`, { method: "PATCH", headers: { "If-Match": String(revision) }, body: input });
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
    const { filename, ...payload } = input;
    return apiRequest<FileUploadIntentDto>("/files/upload-intents", {
      method: "POST",
      headers: { "Idempotency-Key": input.idempotencyKey },
      body: { ...payload, fileName: filename },
    });
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
