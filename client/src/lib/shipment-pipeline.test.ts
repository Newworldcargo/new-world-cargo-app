import { describe, expect, it } from "vitest";
import { shipmentPipeline } from "./shipment-pipeline";
import type { OnlineBooking } from "@/api/bookings";
import type { Shipment } from "./domain";

const booking: OnlineBooking = {
  id: "booking-5", bookingId: "5", reference: "OBR0000005", shipmentId: null,
  service: "local", transportMode: null, packageName: "Parcel", parcelOwner: "Customer",
  origin: "Lusaka", destination: "Longacres", status: "pending", statusLabel: "Awaiting review",
  price: { currency: "ZMW", amountMinor: 0 }, events: [],
};
const shipment: Shipment = {
  id: "99", trackingNumber: "NWC99", carrier: "New World Cargo", transportMode: "air",
  packageName: "Parcel", origin: "Lusaka", destination: "Longacres", eta: "Tomorrow",
  status: "in_transit", statusLabel: "In transit", price: "", progress: 30, events: [],
};

describe("customer shipment pipeline", () => {
  it("uses pending shipment cards without inventing freight mode or arrival dates", () => {
    const [item] = shipmentPipeline([], [booking]);
    expect(item.card).toMatchObject({ statusLabel: "Awaiting approval", transportMode: null, service: "local", eta: "To be confirmed" });
    expect(item.id).toBe("booking-5");
  });
  it("replaces the accepted booking with exactly one shipment using the same card key", () => {
    const accepted = { ...booking, shipmentId: "99", status: "booking_confirmed" as const };
    const items = shipmentPipeline([shipment], [accepted]);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({key: booking.id, id: "99", card: {statusLabel: "In transit", service: "local", transportMode: null}});
  });
  it("does not resurrect approved bookings omitted by shipment filters or pagination", () => {
    expect(shipmentPipeline([], [{ ...booking, shipmentId: "99" }], "", "active")).toEqual([]);
  });
  it("filters pending and declined bookings without showing either as delivered", () => {
    expect(shipmentPipeline([], [booking], "longacres", "active")).toHaveLength(1);
    expect(shipmentPipeline([], [booking], "", "delivered")).toEqual([]);
    expect(shipmentPipeline([], [{ ...booking, status: "cancelled" }], "", "active")).toEqual([]);
    expect(shipmentPipeline([], [{ ...booking, status: "cancelled" }])).toHaveLength(1);
  });
  it("keeps existing unlinked shipments and supports mixed search", () => {
    expect(shipmentPipeline([shipment], [booking])).toHaveLength(2);
    expect(shipmentPipeline([shipment], [booking], "OBR0000005")).toHaveLength(1);
    expect(shipmentPipeline([shipment], [booking], "missing")).toEqual([]);
  });
});
