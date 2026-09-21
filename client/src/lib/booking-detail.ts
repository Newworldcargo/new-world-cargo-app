import type { OnlineBooking } from "@/api/bookings";
import type { Shipment } from "./domain";

export function bookingDetailModel(booking: OnlineBooking): Shipment {
  return {
    id: booking.id, trackingNumber: booking.reference, carrier: "New World Cargo",
    // The view renders the booking service instead when there is no freight mode.
    transportMode: booking.transportMode ?? "air",
    packageName: booking.packageName, parcelOwner: booking.parcelOwner,
    origin: booking.origin || "To be confirmed", destination: booking.destination || "To be confirmed",
    eta: booking.status === "cancelled" ? "Not scheduled" : "To be confirmed",
    status: booking.status === "cancelled" ? "failed" : "pending",
    statusLabel: booking.status === "pending" ? "Awaiting approval" : booking.statusLabel,
    price: "", progress: 0, allowedActions: [],
    nextAction: booking.status === "cancelled" ? booking.statusLabel : booking.status === "booking_confirmed" ? "Booking accepted" : "Your booking is awaiting approval",
    events: booking.events.map(event => ({ label: event.label, detail: event.detail, time: event.displayTime, complete: true })),
  };
}
