import { describe, expect, it } from "vitest";
import { fileUploadIntentInputSchema, paymentIntentInputSchema, shipmentDtoSchema, supportCaseInputSchema, uploadedFileDtoSchema, walletDtoSchema } from "./contracts";
import { customerPortalRepository, portalDataMode } from "./repository";

describe("customer portal API architecture", () => {
  it("uses the mock port only as the development default and retains a single adapter seam", () => {
    expect(portalDataMode).toBe("mock");
    expect(customerPortalRepository).toHaveProperty("listShipments");
    expect(customerPortalRepository).toHaveProperty("createPaymentIntent");
    expect(customerPortalRepository).toHaveProperty("createFileUploadIntent");
    expect(customerPortalRepository).toHaveProperty("completeFileUpload");
    expect(customerPortalRepository).toHaveProperty("listNotifications");
    expect(customerPortalRepository).toHaveProperty("listSupportCases");
    expect(customerPortalRepository).toHaveProperty("getPickup");
    expect(customerPortalRepository).toHaveProperty("getWallet");
  });

  it("requires customer identity and revision metadata on authoritative shipment records", () => {
    const parsed = shipmentDtoSchema.safeParse({
      id: "shipment-1", customerId: "customer-1", trackingNumber: "NWC-1", carrier: "New World Cargo", transportMode: "air", packageName: "Cargo", origin: "Lusaka", destination: "Kitwe", etaAt: null, etaLabel: "Pending", status: "pending", statusLabel: "Pending", price: { currency: "ZMW", amountMinor: 0 }, progress: 0, events: [], allowedActions: [], revision: 0,
    });
    expect(parsed.success).toBe(true);
    expect(shipmentDtoSchema.safeParse({ ...parsed.data, customerId: undefined }).success).toBe(false);
    expect(shipmentDtoSchema.safeParse({ ...parsed.data, revision: undefined }).success).toBe(false);
  });

  it("requires idempotency keys for payment, upload, and support writes", () => {
    expect(paymentIntentInputSchema.safeParse({ invoiceId: "inv-1", method: "card", idempotencyKey: "invalid" }).success).toBe(false);
    expect(fileUploadIntentInputSchema.safeParse({ filename: "note.pdf", contentType: "application/pdf", sizeBytes: 1024, purpose: "support-attachment", idempotencyKey: "invalid" }).success).toBe(false);
    expect(supportCaseInputSchema.safeParse({ category: "delivery", subject: "Need help", detail: "Please contact me.", attachmentFileId: null, idempotencyKey: "invalid" }).success).toBe(false);
  });

  it("supports a completed profile-photo upload without persisting file bytes in customer records", () => {
    expect(fileUploadIntentInputSchema.safeParse({ filename: "photo.png", contentType: "image/png", sizeBytes: 4096, purpose: "profile-photo", idempotencyKey: crypto.randomUUID() }).success).toBe(true);
    expect(uploadedFileDtoSchema.safeParse({ fileId: "file-1", url: "https://cdn.example.test/file-1", contentType: "image/png", sizeBytes: 4096 }).success).toBe(true);
  });

  it("keeps financial balances in a customer-scoped wallet resource", () => {
    expect(walletDtoSchema.safeParse({ id: "wallet-1", customerId: "customer-1", currency: "ZMW", availableBalance: { currency: "ZMW", amountMinor: 0 }, pendingBalance: { currency: "ZMW", amountMinor: 0 }, status: "active", updatedAt: "2026-08-23T08:00:00.000Z", revision: 1 }).success).toBe(true);
  });
});
