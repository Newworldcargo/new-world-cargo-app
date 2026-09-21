import { describe, expect, it } from "vitest";
import type { OnlineBooking } from "@/api/bookings";
import { bookingDetailModel } from "./booking-detail";

const booking: OnlineBooking = { id: "booking-5", bookingId: "5", reference: "BOOKING-5", shipmentId: null, service: "local", transportMode: null, packageName: "Parcel", parcelOwner: "Recipient", origin: "Lusaka", destination: "Longacres", status: "pending", statusLabel: "Awaiting review", price: { currency: "ZMW", amountMinor: 5000 }, events: [{ id: "received", label: "Request received", detail: "Under review", displayTime: "21 Sep 2026" }] };
describe("shared booking detail model", () => {
  it("uses real history without inventing transport progress or a payable bill", () => {
    const result = bookingDetailModel(booking);
    expect(result.statusLabel).toBe("Awaiting approval");
    expect(result.events).toEqual([{ label: "Request received", detail: "Under review", time: "21 Sep 2026", complete: true }]);
    expect(result.allowedActions).toEqual([]);
    expect(result.price).toBe("");
    expect(result.eta).toBe("To be confirmed");
  });
  it("preserves declined state and unknown locations", () => {
    const result = bookingDetailModel({ ...booking, status: "cancelled", statusLabel: "Booking declined", origin: "" });
    expect(result.status).toBe("failed");
    expect(result.nextAction).toBe("Booking declined");
    expect(result.eta).toBe("Not scheduled");
    expect(result.origin).toBe("To be confirmed");
  });
});
