export function shouldMockPaymentFail(value: string) {
  return value.replace(/\D/g, "").endsWith("000");
}

export function canModifyShipment(status: string, cancelled = false) {
  return status !== "delivered" && !cancelled;
}

export function canPayShipment(paymentStatus: "paid" | "unpaid" | undefined, cancelled = false) {
  return paymentStatus === "unpaid" && !cancelled;
}

export function matchesTrackingNumber(trackingNumber: string, query: string) {
  return trackingNumber.trim().toLowerCase() === query.trim().toLowerCase();
}
