import type { OnlineBooking } from "@/api/bookings";
import type { Shipment } from "./domain";

export type ShipmentCardData = Pick<Shipment, "trackingNumber" | "origin" | "destination" | "eta" | "status" | "statusLabel"> & {
  transportMode: Shipment["transportMode"] | null;
  service?: OnlineBooking["service"];
};

export function shipmentPipeline(shipments: Shipment[], bookings: OnlineBooking[], query = "", filter: "all" | "active" | "delivered" = "all") {
  const linkedBookings = new Map(bookings.filter(item => item.shipmentId).map(item => [item.shipmentId!, item]));
  const items: { key: string; id: string; reference?: string; card: ShipmentCardData }[] = [
    ...bookings.filter(booking => !booking.shipmentId).map(booking => ({
      key: booking.id,
      id: booking.id,
      reference: booking.reference,
      card: {
        trackingNumber: booking.reference,
        origin: booking.origin || "To be confirmed",
        destination: booking.destination || "To be confirmed",
        eta: booking.status === "cancelled" ? "Not scheduled" : "To be confirmed",
        status: booking.status === "cancelled" ? "failed" as const : "pending" as const,
        statusLabel: booking.status === "pending" ? "Awaiting approval" : booking.statusLabel,
        transportMode: booking.transportMode,
        service: booking.service,
      },
    })),
    ...shipments.map(shipment => {
      const booking = linkedBookings.get(shipment.id);
      return {
        key: booking?.id ?? shipment.id,
        id: shipment.id,
        reference: booking?.reference,
        card: { ...shipment, ...(booking ? { service: booking.service, transportMode: booking.transportMode } : {}) },
      };
    }),
  ];
  const search = query.trim().toLowerCase();
  return items.filter(({ card, reference }) =>
    (filter !== "delivered" || card.status === "delivered") &&
    (filter !== "active" || !["delivered", "failed"].includes(card.status)) &&
    (!search || [card.trackingNumber, reference, card.origin, card.destination].some(value => value?.toLowerCase().includes(search)))
  );
}
