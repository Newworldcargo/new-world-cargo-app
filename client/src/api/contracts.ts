import { z } from "zod";

export const moneySchema = z.object({
  currency: z.string().length(3),
  amountMinor: z.number().int().nonnegative(),
});

export const shipmentStatusSchema = z.enum([
  "pending",
  "pickup_scheduled",
  "picked_up",
  "in_transit",
  "at_destination",
  "out_for_delivery",
  "delivered",
  "delayed",
  "failed",
  "cancelled",
]);

export const shipmentActionSchema = z.enum([
  "pay",
  "cancel",
  "duplicate",
  "schedule_pickup",
  "reschedule_pickup",
  "cancel_pickup",
  "edit_delivery",
  "reschedule_delivery",
  "collect_from_depot",
  "report_issue",
]);

export const trackingEventSchema = z.object({
  id: z.string(),
  label: z.string(),
  detail: z.string(),
  occurredAt: z.string().datetime().nullable(),
  displayTime: z.string(),
  complete: z.boolean().optional(),
  current: z.boolean().optional(),
});

export const shipmentDtoSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  trackingNumber: z.string(),
  carrier: z.string(),
  transportMode: z.enum(["air", "sea"]),
  packageName: z.string(),
  origin: z.string(),
  destination: z.string(),
  etaAt: z.string().datetime().nullable(),
  etaLabel: z.string(),
  status: shipmentStatusSchema,
  statusLabel: z.string(),
  price: moneySchema,
  imageUrl: z.string().optional(),
  progress: z.number().min(0).max(100),
  events: z.array(trackingEventSchema),
  nextAction: z.string().optional(),
  allowedActions: z.array(shipmentActionSchema),
  revision: z.number().int().nonnegative(),
});

export const addressDtoSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  label: z.string(),
  line: z.string(),
  landmark: z.string(),
  isDefault: z.boolean(),
  revision: z.number().int().nonnegative(),
});

export const recipientDtoSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  name: z.string(),
  location: z.string(),
  phone: z.string(),
  initials: z.string(),
  revision: z.number().int().nonnegative(),
});

export const invoiceStatusSchema = z.enum(["paid", "unpaid", "pending", "failed", "refunded"]);

export const invoiceDtoSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  invoiceNumber: z.string(),
  shipmentId: z.string().nullable(),
  shipmentLabel: z.string(),
  route: z.string(),
  issuedAt: z.string().datetime(),
  issuedAtLabel: z.string(),
  dueAt: z.string().datetime().nullable(),
  dueAtLabel: z.string(),
  status: invoiceStatusSchema,
  total: moneySchema,
  lineItems: z.array(z.object({
    label: z.string(),
    detail: z.string().optional(),
    amount: moneySchema,
  })),
  paymentMethod: z.string().optional(),
  paidAt: z.string().datetime().nullable(),
  paidAtLabel: z.string().optional(),
  revision: z.number().int().nonnegative(),
});

export const officeDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  detail: z.string(),
});

export const deliveryOptionDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  detail: z.string(),
  eta: z.string(),
  price: moneySchema,
  recommended: z.boolean().optional(),
});

export const transportOptionDtoSchema = z.object({
  id: z.enum(["air", "sea"]),
  name: z.string(),
  detail: z.string(),
  eta: z.string(),
});

export const customerReferenceDataSchema = z.object({
  offices: z.array(officeDtoSchema),
  deliveryOptions: z.array(deliveryOptionDtoSchema),
  transportOptions: z.array(transportOptionDtoSchema),
});

export const addressInputSchema = z.object({
  label: z.string().trim().min(1).max(80),
  line: z.string().trim().min(1).max(240),
  landmark: z.string().trim().max(160).default(""),
  isDefault: z.boolean().default(false),
});

export const recipientInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  location: z.string().trim().min(1).max(240),
  phone: z.string().trim().min(4).max(32),
});

export const paymentIntentInputSchema = z.object({
  invoiceId: z.string().min(1),
  method: z.enum(["mobile-money", "card"]),
  idempotencyKey: z.string().uuid(),
});

export const paymentIntentDtoSchema = z.object({
  id: z.string(),
  status: z.enum(["requires_action", "processing", "succeeded", "failed"]),
  providerReference: z.string().optional(),
  clientToken: z.string().optional(),
  revision: z.number().int().nonnegative(),
});

export const fileUploadIntentInputSchema = z.object({
  filename: z.string().trim().min(1).max(255),
  contentType: z.string().trim().min(1).max(120),
  sizeBytes: z.number().int().positive().max(20 * 1024 * 1024),
  purpose: z.enum(["shipment-evidence", "support-attachment", "proof-of-delivery"]),
  idempotencyKey: z.string().uuid(),
});

export const fileUploadIntentDtoSchema = z.object({
  fileId: z.string(),
  uploadUrl: z.string().url(),
  headers: z.record(z.string(), z.string()),
  expiresAt: z.string().datetime(),
});

export const apiProblemSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
    retryable: z.boolean().optional(),
  }),
  requestId: z.string().optional(),
});

export type Money = z.infer<typeof moneySchema>;
export type ShipmentDto = z.infer<typeof shipmentDtoSchema>;
export type ShipmentStatus = z.infer<typeof shipmentStatusSchema>;
export type ShipmentAction = z.infer<typeof shipmentActionSchema>;
export type AddressDto = z.infer<typeof addressDtoSchema>;
export type RecipientDto = z.infer<typeof recipientDtoSchema>;
export type InvoiceDto = z.infer<typeof invoiceDtoSchema>;
export type CustomerReferenceData = z.infer<typeof customerReferenceDataSchema>;
export type AddressInput = z.infer<typeof addressInputSchema>;
export type RecipientInput = z.infer<typeof recipientInputSchema>;
export type PaymentIntentInput = z.infer<typeof paymentIntentInputSchema>;
export type PaymentIntentDto = z.infer<typeof paymentIntentDtoSchema>;
export type FileUploadIntentInput = z.infer<typeof fileUploadIntentInputSchema>;
export type FileUploadIntentDto = z.infer<typeof fileUploadIntentDtoSchema>;
export type ApiProblem = z.infer<typeof apiProblemSchema>;

export type ApiSuccess<T> = { data: T; meta?: { nextCursor?: string; total?: number }; requestId?: string };
