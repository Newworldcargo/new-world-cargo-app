import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  MapPin,
  PhoneCall,
  RefreshCw,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { useCustomerPickup, usePickupMutations } from "@/api/hooks";
import { ErrorState, LoadingState } from "@/components/async-state";

export default function Pickup() {
  const [, navigate] = useLocation();
  const [collectionPoint, setCollectionPoint] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00–12:00");
  const [showScheduler, setShowScheduler] = useState(false);
  const [showFailure, setShowFailure] = useState(false);
  const pickupQuery = useCustomerPickup();
  const pickupMutations = usePickupMutations();
  const pickup = pickupQuery.data;
  const status = pickup?.status ?? "none";
  const schedule = () =>
    pickupMutations.schedule.mutate(
      {
        shipmentId: null,
        collectionPoint: collectionPoint.trim(),
        scheduledDate: date || null,
        scheduledTime: time || null,
      },
      { onSuccess: () => setShowScheduler(false) }
    );

  if (pickupQuery.isLoading)
    return <LoadingState label="Loading pickup booking…" />;
  if (pickupQuery.isError || !pickup)
    return (
      <ErrorState
        title="We could not load your pickup"
        detail="Please try again."
        action={{ label: "Try again", onClick: () => pickupQuery.refetch() }}
      />
    );

  return (
    <div className="mx-auto max-w-3xl text-ink">
      <button
        type="button"
        onClick={() => navigate("/shipments")}
        className="flex items-center gap-2 text-sm font-bold text-ink/55 hover:text-ink"
      >
        <ArrowLeft className="size-4" />
        Back to shipments
      </button>
      <div className="mt-7 flex items-start gap-4">
        <span className="grid size-12 place-items-center rounded-2xl bg-cargo-yellow">
          <CalendarDays className="size-5" />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cargo-yellow">
            Pickup
          </p>
          <h1 className="mt-1 font-heading text-3xl font-extrabold">
            Manage your pickup
          </h1>
          <p className="mt-2 text-sm text-ink/55">
            Choose a collection time, update a booking, or resolve a missed
            pickup.
          </p>
        </div>
      </div>
      {(status === "requested" || status === "scheduled") && (
        <section className="mt-7 rounded-[28px] border border-ink/10 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-cargo-yellow" />
            <div>
              <p className="text-sm font-bold">
                {status === "scheduled"
                  ? "Pickup confirmed"
                  : "Pickup request received"}
              </p>
              <p className="mt-1 text-sm text-ink/55">
                {status === "scheduled" ? (
                  <>
                    Our team will collect your cargo on{" "}
                    <b>{pickup.scheduledDate}</b> between{" "}
                    <b>{pickup.scheduledTime}</b>.
                  </>
                ) : (
                  "Our operations team will confirm your collection time shortly."
                )}
              </p>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <Info
                  icon={<MapPin className="size-4" />}
                  title="Collection point"
                  value={pickup.collectionPoint}
                />
                <Info
                  icon={<PhoneCall className="size-4" />}
                  title="Contact"
                  value="We will call before arrival"
                />
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={pickupMutations.cancel.isPending}
                  onClick={() =>
                    pickupMutations.cancel.mutate({
                      id: pickup.id,
                      revision: pickup.revision,
                    })
                  }
                  className="rounded-xl border border-ink/15 px-4 py-3 text-sm font-bold disabled:opacity-50"
                >
                  {pickupMutations.cancel.isPending
                    ? "Cancelling…"
                    : "Cancel pickup"}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
      {(status === "none" || status === "cancelled" || status === "failed") && (
        <section className="mt-7 rounded-[28px] border border-dashed border-ink/20 bg-[#f7f8fb] p-7 text-center">
          <Clock3 className="mx-auto size-7 text-cargo-yellow" />
          <p className="mt-4 text-lg font-bold">
            {status === "cancelled"
              ? "Pickup cancelled"
              : status === "failed"
                ? "Pickup needs attention"
                : "No pickup is scheduled"}
          </p>
          <p className="mt-2 text-sm text-ink/55">
            Choose a convenient collection slot once your cargo is ready.
          </p>
          <button
            type="button"
            onClick={() => setShowScheduler(true)}
            className="mt-5 rounded-xl bg-cargo-yellow px-5 py-3 text-sm font-bold"
          >
            {status === "none" ? "Schedule pickup" : "Schedule new pickup"}
          </button>
        </section>
      )}
      {pickupMutations.schedule.isError || pickupMutations.cancel.isError ? (
        <p className="mt-4 text-sm text-red-700">
          We could not update the pickup. Refresh and try again.
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => setShowFailure(true)}
        className="mt-5 flex items-center gap-2 text-sm font-bold text-ink/60 hover:text-ink"
      >
        <CircleAlert className="size-4 text-cargo-yellow" />
        My pickup was missed or failed
      </button>
      {showScheduler && (
        <Dialog title="Schedule pickup" onClose={() => setShowScheduler(false)}>
          <div className="mt-5 grid gap-3">
            <label className="text-xs font-bold text-ink/55">
              Collection address
              <input
                required
                value={collectionPoint}
                onChange={event => setCollectionPoint(event.target.value)}
                placeholder="Street, area, city"
                className="mt-2 w-full rounded-xl border border-ink/12 bg-white px-3 py-3 text-sm"
              />
            </label>
            <label className="text-xs font-bold text-ink/55">
              Preferred date <span className="font-normal">Optional</span>
              <input
                type="date"
                value={date}
                onChange={event => setDate(event.target.value)}
                className="mt-2 w-full rounded-xl border border-ink/12 bg-white px-3 py-3 text-sm"
              />
            </label>
            <label className="text-xs font-bold text-ink/55">
              Preferred time <span className="font-normal">Optional</span>
              <select
                value={time}
                onChange={event => setTime(event.target.value)}
                className="mt-2 w-full rounded-xl border border-ink/12 bg-white px-3 py-3 text-sm"
              >
                <option value="">No preference</option>
                <option>09:00–12:00</option>
                <option>12:00–15:00</option>
                <option>15:00–18:00</option>
              </select>
            </label>
          </div>
          <button
            type="button"
            disabled={
              !collectionPoint.trim() || pickupMutations.schedule.isPending
            }
            onClick={schedule}
            className="mt-5 w-full rounded-xl bg-cargo-yellow py-3 text-sm font-bold"
          >
            {pickupMutations.schedule.isPending ? "Saving…" : "Request pickup"}
          </button>
        </Dialog>
      )}
      {showFailure && (
        <Dialog
          title="Resolve a missed pickup"
          onClose={() => setShowFailure(false)}
        >
          <p className="mt-2 text-sm text-ink/55">
            Tell us what happened. You can book another slot now or contact
            support with the shipment details.
          </p>
          <div className="mt-5 grid gap-2">
            <button
              type="button"
              onClick={() => {
                setShowFailure(false);
                setShowScheduler(true);
              }}
              className="rounded-xl bg-cargo-yellow px-4 py-3 text-left text-sm font-bold"
            >
              <RefreshCw className="mr-2 inline size-4" />
              Book another pickup
            </button>
            <button
              type="button"
              onClick={() => navigate("/support?category=pickup")}
              className="rounded-xl border border-ink/15 px-4 py-3 text-left text-sm font-bold"
            >
              Report the problem
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}

function Info({
  icon,
  title,
  value,
}: {
  icon: ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-[#f7f8fb] p-4">
      <div className="flex items-center gap-2 text-cargo-yellow">
        {icon}
        <p className="text-xs font-bold text-ink/55">{title}</p>
      </div>
      <p className="mt-2 text-sm font-semibold">{value}</p>
    </div>
  );
}
function Dialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4">
      <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold">{title}</h2>
          <button type="button" onClick={onClose}>
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
