import { ArrowLeft, ArrowRight, Package } from "lucide-react";
import { useLocation } from "wouter";
import { bookingServiceLabels, useCustomerBooking } from "@/api/bookings";
import { CustomerApiError } from "@/api/errors";

export default function BookingDetail({ id }: { id: string }) {
  const [, navigate] = useLocation();
  const { data: booking, isLoading, error, refetch } = useCustomerBooking(id);
  return <div className="mx-auto max-w-3xl">
    <button type="button" onClick={() => navigate("/shipments")} aria-label="Back to shipments" title="Back to shipments" className="mb-6 grid size-11 place-items-center rounded-lg border border-ink/15"><ArrowLeft className="size-5" /></button>
    {isLoading ? <p role="status">Loading your booking...</p> : error || !booking ? <div role="alert">
      <h1 className="text-2xl font-bold">{error instanceof CustomerApiError && error.status === 404 ? "Booking not found" : "We couldn't load your booking"}</h1>
      <p className="mt-2 text-sm text-ink/65">Check your connection and try again, or return to your bookings.</p>
      <button onClick={() => refetch()} className="mt-4 rounded-lg bg-cargo-yellow px-5 py-3 font-bold text-ink">Try again</button>
    </div> : <>
      <div className="flex items-start gap-3"><Package className="mt-1 size-6 shrink-0" /><div>
        <h1 className="text-3xl font-bold">{booking.reference}</h1>
        <p className="mt-1 text-sm text-ink/65">{bookingServiceLabels[booking.service]}{booking.transportMode ? ` · ${booking.transportMode === "air" ? "Air freight" : "Sea freight"}` : ""}</p>
      </div></div>
      <p className="mt-5 font-semibold" role="status">{booking.statusLabel}</p>
      {booking.status === "pending" && <p className="mt-2 text-sm text-ink/65">Your request has been received. We will confirm the arrangements after reviewing your booking.</p>}
      <dl className="mt-7 divide-y divide-ink/10 border-y border-ink/10">
        {[["From", booking.origin], ["To", booking.destination], ["Cargo", booking.packageName], ["Recipient", booking.parcelOwner]].map(([label, value]) => <div key={label} className="grid gap-1 py-4 sm:grid-cols-[100px_minmax(0,1fr)]"><dt className="text-sm text-ink/60">{label}</dt><dd className="break-words font-medium">{value || "Not provided"}</dd></div>)}
      </dl>
      <section className="mt-7" aria-label="Booking updates"><h2 className="text-lg font-bold">Booking updates</h2>{booking.events.map(event => <div key={event.id} className="mt-4"><p className="font-semibold">{event.label}</p><p className="mt-1 text-sm text-ink/65">{event.detail}</p><p className="mt-1 text-xs text-ink/60">{event.displayTime}</p></div>)}</section>
      {booking.shipmentId && <button onClick={() => navigate(`/shipments/${booking.shipmentId}`)} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-cargo-yellow px-5 py-3 font-bold text-ink">View shipment <ArrowRight className="size-4" /></button>}
    </>}
  </div>;
}
