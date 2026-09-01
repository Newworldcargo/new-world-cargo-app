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
  consignmentCode: z.string().nullable().optional(),
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
  name: z.string(),
  countryCode: z.string().nullable().optional(),
  address: z.string(),
  phone: z.string(),
  revision: z.number().int().nonnegative(),
  createdAt: z.string().datetime().nullable().optional(),
  updatedAt: z.string().datetime().nullable().optional(),
});

export const invoiceStatusSchema = z.enum([
  "paid",
  "unpaid",
  "pending",
  "failed",
  "refunded",
]);

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
  lineItems: z.array(
    z.object({
      label: z.string(),
      detail: z.string().optional(),
      amount: moneySchema,
    })
  ),
  paymentMethod: z.string().optional(),
  paidAt: z.string().datetime().nullable(),
  paidAtLabel: z.string().optional(),
  revision: z.number().int().nonnegative(),
});

export const walletDtoSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  currency: z.string().length(3),
  availableBalance: moneySchema,
  pendingBalance: moneySchema,
  status: z.enum(["active", "restricted", "closed"]),
  updatedAt: z.string().datetime(),
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
  address: z.string().trim().min(1).max(1000),
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
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(20 * 1024 * 1024),
  purpose: z.enum([
    "shipment-evidence",
    "support-attachment",
    "proof-of-delivery",
    "profile-photo",
  ]),
  idempotencyKey: z.string().uuid(),
});

export const fileUploadIntentDtoSchema = z.object({
  fileId: z.string(),
  uploadUrl: z.string().url(),
  headers: z.record(z.string(), z.string()),
  requiresPortalAuth: z.boolean().default(false),
  expiresAt: z.string().datetime(),
});

export const uploadedFileDtoSchema = z.object({
  fileId: z.string(),
  url: z.string().url(),
  contentType: z.string(),
  sizeBytes: z.number().int().positive(),
});

export const notificationTypeSchema = z.enum([
  "progress",
  "arrival",
  "exception",
  "payment",
]);

export const notificationDtoSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  type: notificationTypeSchema,
  title: z.string(),
  body: z.string(),
  occurredAt: z.string().datetime(),
  displayTime: z.string(),
  shipmentId: z.string().nullable(),
  unread: z.boolean(),
  revision: z.number().int().nonnegative(),
});

export const supportCaseStatusSchema = z.enum([
  "open",
  "in_review",
  "resolved",
]);
export const supportCaseDtoSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  category: z.string(),
  subject: z.string(),
  detail: z.string(),
  status: supportCaseStatusSchema,
  createdAt: z.string().datetime(),
  displayCreatedAt: z.string(),
  attachmentFileId: z.string().nullable(),
  revision: z.number().int().nonnegative(),
});
export const supportCaseInputSchema = z.object({
  category: z.string().trim().min(1).max(100),
  subject: z.string().trim().min(1).max(180),
  detail: z.string().trim().min(1).max(5_000),
  attachmentFileId: z.string().nullable().default(null),
  idempotencyKey: z.string().uuid(),
});

export const returnRequestStatusSchema = z.enum([
  "draft",
  "requested",
  "approved",
  "in_transit",
  "completed",
  "rejected",
]);
export const returnRequestDtoSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  shipmentId: z.string(),
  trackingNumber: z.string(),
  reason: z.string(),
  handover: z.enum(["pickup", "drop_off"]),
  status: returnRequestStatusSchema,
  displayStatus: z.string(),
  createdAt: z.string().datetime(),
  revision: z.number().int().nonnegative(),
});
export const returnRequestInputSchema = z.object({
  shipmentId: z.string().min(1),
  reason: z.string().trim().min(1).max(1_000),
  handover: z.enum(["pickup", "drop_off"]),
  idempotencyKey: z.string().uuid(),
});

export const shipmentDraftStatusSchema = z.enum([
  "draft",
  "quoted",
  "submitted",
  "deleted",
]);
export const shipmentDraftDtoSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  status: shipmentDraftStatusSchema,
  payload: z.record(z.string(), z.unknown()),
  quoteId: z.string().nullable(),
  shipmentId: z.string().nullable(),
  expiresAt: z.string().datetime().nullable(),
  revision: z.number().int().nonnegative(),
  createdAt: z.string().datetime().nullable(),
  updatedAt: z.string().datetime().nullable(),
});
export const shipmentDraftInputSchema = z.object({
  payload: z.record(z.string(), z.unknown()),
  expiresAt: z.string().datetime().nullable().optional(),
});

export const pickupStatusSchema = z.enum([
  "requested",
  "scheduled",
  "completed",
  "cancelled",
  "failed",
]);
export const pickupDtoSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  shipmentId: z.string().nullable(),
  status: pickupStatusSchema,
  collectionPoint: z.string(),
  scheduledDate: z.string().nullable(),
  scheduledTime: z.string().nullable(),
  revision: z.number().int().nonnegative(),
});
export const pickupInputSchema = z.object({
  shipmentId: z.string().nullable().default(null),
  collectionPoint: z.string().trim().min(1).max(500),
  scheduledDate: z.string().date().nullable().default(null),
  scheduledTime: z.string().trim().max(80).nullable().default(null),
  idempotencyKey: z.string().uuid(),
});

export const sessionActivityDtoSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  device: z.string(),
  location: z.string(),
  lastActiveAt: z.string().datetime(),
  displayLastActiveAt: z.string(),
  current: z.boolean(),
  trusted: z.boolean(),
  revision: z.number().int().nonnegative(),
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
export type WalletDto = z.infer<typeof walletDtoSchema>;
export type CustomerReferenceData = z.infer<typeof customerReferenceDataSchema>;
export type AddressInput = z.infer<typeof addressInputSchema>;
export type RecipientInput = z.infer<typeof recipientInputSchema>;
export type PaymentIntentInput = z.infer<typeof paymentIntentInputSchema>;
export type PaymentIntentDto = z.infer<typeof paymentIntentDtoSchema>;
export type FileUploadIntentInput = z.infer<typeof fileUploadIntentInputSchema>;
export type FileUploadIntentDto = z.infer<typeof fileUploadIntentDtoSchema>;
export type UploadedFileDto = z.infer<typeof uploadedFileDtoSchema>;
export type NotificationDto = z.infer<typeof notificationDtoSchema>;
export type NotificationType = z.infer<typeof notificationTypeSchema>;
export type SupportCaseDto = z.infer<typeof supportCaseDtoSchema>;
export type SupportCaseInput = z.infer<typeof supportCaseInputSchema>;
export type SupportCaseStatus = z.infer<typeof supportCaseStatusSchema>;
export type ReturnRequestDto = z.infer<typeof returnRequestDtoSchema>;
export type ReturnRequestInput = z.infer<typeof returnRequestInputSchema>;
export type ShipmentDraftDto = z.infer<typeof shipmentDraftDtoSchema>;
export type ShipmentDraftInput = z.infer<typeof shipmentDraftInputSchema>;
export type PickupDto = z.infer<typeof pickupDtoSchema>;
export type PickupInput = z.infer<typeof pickupInputSchema>;
export type SessionActivityDto = z.infer<typeof sessionActivityDtoSchema>;
export type ApiProblem = z.infer<typeof apiProblemSchema>;

export type ApiSuccess<T> = {
  data: T;
  meta?: { nextCursor?: string; total?: number };
  requestId?: string;
};
