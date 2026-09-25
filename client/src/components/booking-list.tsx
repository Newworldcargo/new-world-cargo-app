import { ContentSkeleton } from "@/components/loading-skeleton";
import { ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { bookingServiceLabels, useCustomerBookings } from "@/api/bookings";

export function BookingList({ query, filter }: { query: string; filter: "all" | "active" | "delivered" }) {
  const [, navigate] = useLocation();
  const { data = [], isLoading, isError, refetch } = useCustomerBookings();
  if (filter === "delivered") return null;
  const search = query.trim().toLowerCase();
  const bookings = data.filter(booking =>
    (filter !== "active" || booking.status === "pending") &&
    (!search || [booking.reference, booking.origin, booking.destination, booking.packageName].some(value => value.toLowerCase().includes(search)))
  );
  return <section className="mt-8" aria-labelledby="bookings-heading">
    <h2 id="bookings-heading" className="mb-4 text-lg font-bold">Booking requests</h2>
    {isLoading ? <ContentSkeleton label="Loading bookings" /> : isError ? <div role="alert"><p>We couldn't load your bookings.</p><button onClick={() => refetch()} className="mt-2 rounded-lg border border-ink/20 px-4 py-2 font-semibold">Try again</button></div> : bookings.length ? <ul className="divide-y divide-ink/10 border-y border-ink/10">
      {bookings.map(booking => <li key={booking.id}><button onClick={() => navigate(`/shipments/${booking.id}`)} className="flex w-full items-center gap-4 py-4 text-left transition hover:bg-ink/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cargo-yellow">
        <span className="min-w-0 flex-1"><span className="block font-bold">{booking.reference}</span><span className="mt-1 block break-words text-sm">{booking.origin} to {booking.destination}</span><span className="mt-1 block text-xs text-ink/65">{bookingServiceLabels[booking.service]} · {booking.statusLabel}</span></span><ArrowRight className="mr-2 size-5 shrink-0" />
      </button></li>)}
    </ul> : <p className="text-sm text-ink/65">{query ? "No bookings match your search." : "No booking requests yet."}</p>}
  </section>;
}
