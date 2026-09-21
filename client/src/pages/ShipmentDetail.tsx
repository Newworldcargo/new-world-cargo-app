import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleHelp,
  FileCheck2,
  MoreHorizontal,
  PackageOpen,
  PhoneCall,
  RotateCcw,
  Share2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { feedback } from "@/lib/feedback";
import {
  CargoModeLabel,
  ShipmentActions,
  StatusBadge,
  Timeline,
} from "@/components/shipment-ui";
import { ShipmentPayments } from "@/components/shipment-payments";
import { canModifyShipment } from "@/lib/workflow-completion";
import { cargoAssets } from "@/lib/cargo-assets";
import { useCustomerShipment } from "@/api/hooks";
import { apiRequest } from "@/api/http";
import { bookingServiceLabels, useCustomerBooking, type OnlineBooking } from "@/api/bookings";
import { bookingDetailModel } from "@/lib/booking-detail";
import type { Shipment } from "@/lib/domain";

export default function ShipmentDetail() {
  const [, params] = useRoute("/shipments/:id");
  const bookingId = /^booking-(\d+)$/.exec(params?.id ?? "")?.[1];
  return bookingId ? <BookingRecordDetail key={bookingId} id={bookingId} /> : <ConfirmedShipmentDetail key={params?.id} id={params?.id} />;
}

export function BookingRecordDetail({ id }: { id: string }) {
  const { data: booking, isLoading, error, refetch } = useCustomerBooking(id);
  if (isLoading) return <p role="status">Loading your shipment...</p>;
  if (error || !booking) return <DetailLoadError retry={() => void refetch()} />;
  if (booking.shipmentId) return <ConfirmedShipmentDetail key={booking.shipmentId} id={booking.shipmentId} booking={booking} />;
  return <ShipmentDetailView key={booking.id} shipment={bookingDetailModel(booking)} booking={booking} />;
}

function DetailLoadError({ retry }: { retry: () => void }) {
  return <div className="mx-auto max-w-xl py-12 text-center" role="alert"><h1 className="text-2xl font-bold">We couldn't load these shipment details</h1><p className="mt-2 text-sm text-ink/65">Please try again or return to your shipments.</p><button onClick={retry} className="mt-4 rounded-lg bg-cargo-yellow px-5 py-3 font-bold text-ink">Try again</button><a href="/shipments" className="ml-4 underline">View shipments</a></div>;
}

function ConfirmedShipmentDetail({ id, booking }: { id: string | undefined; booking?: OnlineBooking }) {
  const { data: shipment, isLoading, error, refetch } = useCustomerShipment(id);
  if (isLoading) return <p role="status">Loading your shipment...</p>;
  if (error || !shipment) return <DetailLoadError retry={() => void refetch()} />;
  return <ShipmentDetailView key={shipment.id} shipment={shipment} booking={booking} />;
}

function ShipmentDetailView({ shipment, booking }: { shipment: Shipment; booking?: OnlineBooking }) {
  const [, navigate] = useLocation();
  const requestOnly = Boolean(booking && !booking.shipmentId);
  const [showReschedule, setShowReschedule] = useState(false);
  const [showDelivery, setShowDelivery] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showJourney, setShowJourney] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryRevision, setDeliveryRevision] = useState<number | null>(null);
  const [deliverySaving, setDeliverySaving] = useState(false);
  const [deliveryError, setDeliveryError] = useState("");

  useEffect(() => {
    if (requestOnly) return;
    void apiRequest<{
      recipientName: string | null;
      recipientPhone: string | null;
      recipientAddress: string | null;
      revision: number;
    }>(`/shipments/${encodeURIComponent(shipment.id)}/delivery`)
      .then(delivery => {
        setRecipientName(delivery.recipientName || "");
        setRecipientPhone(delivery.recipientPhone || "");
        setDeliveryAddress(delivery.recipientAddress || "");
        setDeliveryRevision(delivery.revision);
        setDeliveryError("");
      })
      .catch(() => setDeliveryError("We could not load delivery details."));
  }, [shipment.id, requestOnly]);

  const canModify = !requestOnly && canModifyShipment(shipment.status, cancelled);
  const saveDelivery = async () => {
    if (deliveryRevision === null) return;
    setDeliverySaving(true);
    setDeliveryError("");
    try {
      const delivery = await apiRequest<{
        recipientName: string | null;
        recipientPhone: string | null;
        recipientAddress: string | null;
        revision: number;
      }>(`/shipments/${encodeURIComponent(shipment.id)}/delivery`, {
        method: "PATCH",
        headers: { "If-Match": String(deliveryRevision) },
        body: {
          recipientName,
          recipientPhone,
          recipientAddress: deliveryAddress,
        },
      });
      setRecipientName(delivery.recipientName || "");
      setRecipientPhone(delivery.recipientPhone || "");
      setDeliveryAddress(delivery.recipientAddress || "");
      setDeliveryRevision(delivery.revision);
      setShowDelivery(false);
      feedback.success("Delivery details updated.");
    } catch {
      setDeliveryError(
        "We could not update delivery details. They may no longer be editable."
      );
    } finally {
      setDeliverySaving(false);
    }
  };
  const sendAgain = () => {
    if (booking) {
      navigate(`/send/${booking.service}/route`);
      return;
    }
    localStorage.setItem(
      "new-world-cargo-duplicate",
      JSON.stringify({
        origin: shipment.origin,
        destination: shipment.destination,
        transport: shipment.transportMode,
      })
    );
    navigate("/send?duplicate=latest");
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between gap-3">
        <button
          onClick={() => navigate("/shipments")}
          className="inline-flex min-w-0 items-center gap-2 text-xs font-bold text-white/45 transition hover:text-white"
        >
          <ArrowLeft className="size-4 shrink-0" />
          Back to shipments
        </button>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_0.78fr] lg:items-start">
        <div>
          <section className="relative overflow-hidden rounded-[32px] bg-cargo-yellow p-6 text-ink sm:p-8">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `url(${cargoAssets.package})`,
                backgroundPosition: "right center",
                backgroundSize: "cover",
                mixBlendMode: "multiply",
              }}
            />
            <div className="relative">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {booking ? <p className="text-sm font-bold">{bookingServiceLabels[booking.service]}{booking.transportMode ? ` · ${booking.transportMode === "air" ? "Air freight" : "Sea freight"}` : ""}</p> : <CargoModeLabel mode={shipment.transportMode} />}
                  <h1 className="mt-3 break-all font-heading text-3xl font-extrabold">
                    {shipment.trackingNumber}
                  </h1>
                </div>
                <button
                  onClick={() => setShowActions(true)}
                  className="grid size-10 shrink-0 place-items-center rounded-full bg-ink/10"
                  aria-label="Shipment actions"
                >
                  <MoreHorizontal className="size-5" />
                </button>
              </div>
              <div className="mt-8 flex items-center justify-between gap-3">
                <RouteEnd label={shipment.origin} />
                <div className="flex flex-1 items-center gap-1 px-2">
                  <span className="size-2.5 rounded-full bg-ink" />
                  <span className="h-px flex-1 bg-ink/30" />
                  <PackageOpen className="size-5" />
                  <span className="h-px flex-1 bg-ink/30" />
                  <span className="size-2.5 rounded-full border-2 border-ink bg-cargo-yellow" />
                </div>
                <RouteEnd label={shipment.destination} align="right" />
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-ink/15 pt-4">
                <StatusBadge
                  status={shipment.status}
                  label={
                    cancelled ? "Cancellation requested" : shipment.statusLabel
                  }
                />
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink/45">
                    Estimated arrival
                  </p>
                  <p className="mt-1 text-sm font-bold">{shipment.eta}</p>
                </div>
              </div>
            </div>
          </section>
          <div className="mt-4">
            <ShipmentActions
              shipment={shipment}
              onReschedule={() => setShowReschedule(true)}
            />
          </div>
          <section className="mt-6 rounded-[28px] border border-white/8 bg-white/[0.035] p-5 sm:p-7">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/30">
                  {requestOnly ? "Booking progress" : "Where it is now"}
                </p>
                <h2 className="mt-2 font-heading text-xl font-bold">
                  {cancelled
                    ? "Cancellation review in progress"
                    : shipment.nextAction}
                </h2>
              </div>
              <span className="grid size-10 place-items-center rounded-2xl bg-cargo-yellow/15 text-cargo-yellow">
                <PackageOpen className="size-5" />
              </span>
            </div>
            <Timeline shipment={shipment} />
            {!requestOnly && <button
              onClick={() => setShowJourney(!showJourney)}
              className="mt-6 flex w-full items-center justify-center rounded-2xl border border-white/10 py-3 text-xs font-bold text-white/70"
            >
              {showJourney ? "Hide detailed journey" : "View detailed journey"}
            </button>}
            {showJourney && (
              <p className="mt-4 rounded-2xl bg-white/[0.04] p-4 text-xs leading-6 text-white/45">
                Hub scans and operational handoffs will appear here as New World
                Cargo receives live updates.
              </p>
            )}
          </section>
        </div>
        <aside className="space-y-4 lg:sticky lg:top-24">
          <section className="rounded-[28px] border border-white/8 bg-white/[0.035] p-5 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/30">
              Helpful next steps
            </p>
            <div className="mt-4 space-y-2">
              {!requestOnly && <Action
                onClick={() => setShowDelivery(true)}
                icon={<CheckCircle2 className="size-5 text-cargo-yellow" />}
                label="Manage delivery"
              />}
              {!requestOnly && <Action
                onClick={() => navigate("/pickups")}
                icon={<CalendarDays className="size-5 text-cargo-yellow" />}
                label="Manage pickup"
              />}
              <Action
                onClick={() =>
                  navigate(`/support?shipment=${shipment.trackingNumber}`)
                }
                icon={<CircleHelp className="size-5 text-cargo-yellow" />}
                label="Get help with this shipment"
              />
              <a
                href="tel:+260000000000"
                className="flex w-full items-center gap-3 rounded-2xl bg-white/[0.05] p-3 text-left"
              >
                <PhoneCall className="size-5 text-cargo-yellow" />
                <span className="text-sm font-semibold">Contact support</span>
              </a>
            </div>
          </section>
          <section className="rounded-[28px] border border-white/8 bg-[#202020] p-5 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/30">
              Shipment details
            </p>
            <div className="mt-4 space-y-3 text-sm">
              <Detail label="Package" value={shipment.packageName} />
              {shipment.parcelOwner && <Detail label="Recipient" value={shipment.parcelOwner} />}
              {booking && <Detail label="Booking reference" value={booking.reference} />}
              <div className="flex items-center justify-between gap-4">
                <span className="text-white/40">{booking ? "Service" : "Transport"}</span>
                {booking ? <span className="text-right font-semibold">{bookingServiceLabels[booking.service]}</span> : <CargoModeLabel mode={shipment.transportMode} compact />}
              </div>
            </div>
          </section>
          <ShipmentPayments shipmentId={shipment.id} reference={shipment.trackingNumber} cancelled={cancelled} booking={requestOnly ? booking : undefined} />
          {!requestOnly && <div className="grid grid-cols-2 gap-2">
            <Action
              onClick={() => navigate(`/shipments/${shipment.id}/proof`)}
              icon={<FileCheck2 className="size-4" />}
              label="Proof of delivery"
              compact
            />
          </div>}
        </aside>
      </div>
      {showDelivery && (
        <Overlay>
          <ModalTitle
            title="Manage delivery"
            onClose={() => setShowDelivery(false)}
          />
          <p className="mt-1 text-xs text-white/45">
            Changes are available only before dispatch. New World Cargo will
            confirm any delivery fee changes.
          </p>
          <div className="mt-5 space-y-3">
            <label className="block text-xs font-bold text-white/55">
              Recipient
              <input
                value={recipientName}
                onChange={event => setRecipientName(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white outline-none focus:border-cargo-yellow"
              />
            </label>
            <label className="block text-xs font-bold text-white/55">
              Recipient phone
              <input
                value={recipientPhone}
                onChange={event => setRecipientPhone(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white outline-none focus:border-cargo-yellow"
              />
            </label>
            <label className="block text-xs font-bold text-white/55">
              Delivery address
              <input
                value={deliveryAddress}
                onChange={event => setDeliveryAddress(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white outline-none focus:border-cargo-yellow"
              />
            </label>
            {deliveryError ? (
              <p className="text-xs font-semibold text-red-300">
                {deliveryError}
              </p>
            ) : null}
            <button
              onClick={() =>
                navigate(
                  `/support?shipment=${shipment.trackingNumber}&category=delivery-attempt`
                )
              }
              className="text-left text-xs font-bold text-cargo-yellow"
            >
              Delivery attempt failed? Get help
            </button>
          </div>
          <ModalButtons
            primary={deliverySaving ? "Saving…" : "Save delivery changes"}
            onPrimary={() => {
              void saveDelivery();
            }}
            onCancel={() => setShowDelivery(false)}
          />
        </Overlay>
      )}
      {showActions && (
        <Overlay>
          <ModalTitle
            title="Shipment actions"
            onClose={() => setShowActions(false)}
          />
          <div className="mt-5 grid gap-2">
            <button
              onClick={sendAgain}
              className="rounded-xl bg-white/[0.06] px-4 py-3 text-left text-sm font-bold"
            >
              <RotateCcw className="mr-2 inline size-4 text-cargo-yellow" />
              Send again
            </button>
            {canModify && (
              <button
                onClick={() => {
                  setCancelled(true);
                  setShowActions(false);
                  feedback.success(
                    "Cancellation requested. We will confirm the outcome shortly."
                  );
                }}
                className="rounded-xl border border-cargo-yellow/40 px-4 py-3 text-left text-sm font-bold text-cargo-yellow"
              >
                Cancel shipment
              </button>
            )}
            <button
              onClick={() =>
                navigator.share?.({
                  title: "New World Cargo shipment",
                  text: shipment.trackingNumber,
                })
              }
              className="rounded-xl bg-white/[0.06] px-4 py-3 text-left text-sm font-bold"
            >
              <Share2 className="mr-2 inline size-4 text-cargo-yellow" />
              Share tracking
            </button>
          </div>
        </Overlay>
      )}
      {showReschedule && (
        <Overlay>
          <ModalTitle
            title="Choose a new time"
            onClose={() => setShowReschedule(false)}
          />
          <p className="mt-1 text-xs text-white/45">
            You can change this again before the courier leaves.
          </p>
          <div className="mt-5 grid gap-2">
            {[
              "Tomorrow · 09:00–12:00",
              "Tomorrow · 14:00–17:00",
              "18 Aug · 09:00–12:00",
            ].map(time => (
              <button
                key={time}
                onClick={() => {
                  setShowReschedule(false);
                  feedback.success(`Delivery rescheduled for ${time}`);
                }}
                className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-left text-sm font-bold hover:border-cargo-yellow"
              >
                {time}
              </button>
            ))}
          </div>
        </Overlay>
      )}
    </div>
  );
}

function RouteEnd({ label, align }: { label: string; align?: "right" }) {
  const [city, ...location] = label.split(",");
  const country = location.join(",").trim();
  return (
    <div className={`min-w-0 flex-1 break-words ${align === "right" ? "text-right" : ""}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink/45">
        {city}
      </p>
      <p className="mt-1 text-lg font-bold">{country || city}</p>
    </div>
  );
}
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-white/40">{label}</span>
      <span className="min-w-0 break-words text-right font-semibold">{value}</span>
    </div>
  );
}
function Action({
  icon,
  label,
  onClick,
  compact,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={
        compact
          ? "flex items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/[0.035] p-3 text-xs font-bold text-white/60"
          : "flex w-full items-center gap-3 rounded-2xl bg-white/[0.05] p-3 text-left"
      }
    >
      {icon}
      <span className={compact ? "" : "text-sm font-semibold"}>{label}</span>
    </button>
  );
}
function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-[30px] bg-[#222] p-6">
        {children}
      </div>
    </div>
  );
}
function ModalTitle({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="font-heading text-xl font-bold">{title}</h2>
      <button onClick={onClose} aria-label="Close">
        <X className="size-5" />
      </button>
    </div>
  );
}
function ModalButtons({
  primary,
  onPrimary,
  onCancel,
}: {
  primary: string;
  onPrimary: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="mt-4 flex gap-2">
      <button
        onClick={onCancel}
        className="flex-1 rounded-xl border border-white/15 py-3 text-sm font-bold"
      >
        Cancel
      </button>
      <button
        onClick={onPrimary}
        className="flex-1 rounded-xl bg-cargo-yellow py-3 text-sm font-bold text-ink"
      >
        {primary}
      </button>
    </div>
  );
}
