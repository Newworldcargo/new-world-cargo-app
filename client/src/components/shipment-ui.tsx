// New World Cargo style reminder: Poppins, dark command-center canvas, Cargo Yellow action color, lavender route accents, mobile-first.

/* Design reminder: shipment surfaces use only Cargo Yellow for air cargo and #012642 blue for sea cargo; white and opacity values are neutral contrast aids. */
import { ArrowUpRight, Check, ChevronRight, Clock3, Copy, MapPin, PackageCheck, Plane, RefreshCw, Share2, Ship, Truck, Zap } from "lucide-react";
import { toast } from "sonner";
import type { Shipment, ShipmentStatus } from "@/lib/domain";

const statusStyles: Record<ShipmentStatus, string> = {
  pending: "bg-ink/10 text-ink",
  pickup_scheduled: "bg-cargo-yellow text-ink",
  picked_up: "bg-ink/10 text-ink",
  in_transit: "bg-brand-secondary text-cargo-yellow",
  at_destination: "bg-ink/10 text-ink",
  out_for_delivery: "bg-cargo-yellow text-ink",
  delivered: "bg-cargo-yellow text-ink",
  delayed: "bg-ink/10 text-ink",
  failed: "bg-brand-secondary text-white",
};

export function StatusBadge({ status, label, small = false }: { status: ShipmentStatus; label: string; small?: boolean }) {
  const Icon = status === "delayed" || status === "failed" ? Clock3 : status === "delivered" ? Check : status === "out_for_delivery" ? Zap : Truck;
  return <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${small ? "px-2.5 py-1 text-[10px]" : "px-3 py-1.5 text-xs"} ${statusStyles[status]}`}><Icon className={small ? "size-3" : "size-3.5"} strokeWidth={2.2} />{label}</span>;
}

export function CargoModeLabel({ mode, compact = false }: { mode: Shipment["transportMode"]; compact?: boolean }) {
  const isAir = mode === "air";
  const Icon = isAir ? Plane : Ship;
  return <span className={`inline-flex items-center gap-1.5 rounded-full border font-bold ${isAir ? "border-ink/15 bg-white/55 text-ink" : "sea-cargo-badge border-brand-secondary"} ${compact ? "px-2 py-1 text-[10px]" : "px-2.5 py-1.5 text-xs"}`}><Icon className={compact ? "size-3" : "size-3.5"} strokeWidth={2.1} />{isAir ? "Air cargo" : "Sea cargo"}</span>;
}

export function ShipmentCard({ shipment, onOpen }: { shipment: Shipment; onOpen?: () => void }) {
  const isAir = shipment.transportMode === "air";
  const tone = isAir ? "bg-cargo-yellow text-ink" : "sea-cargo-surface";
  const muted = isAir ? "text-ink/45" : "sea-cargo-muted";
  const rule = isAir ? "border-ink/15" : "border-white/20";
  const routeLine = isAir ? "bg-ink/35" : "bg-white/35";
  const routeEnd = isAir ? "border-ink bg-cargo-yellow" : "border-cargo-yellow bg-brand-secondary";
  return (
    <button onClick={onOpen} className="group w-full text-left" aria-label={`Open shipment ${shipment.trackingNumber}`}>
      <div className={`relative overflow-hidden rounded-[28px] p-5 transition duration-200 group-hover:-translate-y-1 group-hover:shadow-[0_18px_40px_rgba(1,38,66,0.12)] sm:p-6 ${tone}`}>
        <div className={`absolute -bottom-8 -right-8 size-32 rounded-full border-[18px] ${isAir ? "border-ink/15" : "border-cargo-yellow/35"}`} />
        <div className="relative flex min-w-0 items-start justify-between gap-3"><div className="min-w-0"><CargoModeLabel mode={shipment.transportMode} compact /><p className="mt-2 truncate font-heading text-lg font-extrabold tracking-tight">{shipment.trackingNumber}</p></div><span className="shrink-0"><StatusBadge status={shipment.status} label={shipment.statusLabel} small /></span></div>
        <div className="relative mt-7 grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-3"><div className="min-w-0"><p className={`text-[10px] font-bold uppercase tracking-[0.16em] ${muted}`}>From</p><p className="mt-1 text-sm font-bold">{shipment.origin.split(",")[0]}</p></div><div className="mb-1 flex shrink-0 items-center gap-1.5"><span className={`size-2 rounded-full ${isAir ? "bg-ink" : "bg-cargo-yellow"}`} /><span className={`h-px w-10 ${routeLine}`} /><span className={`size-2 rounded-full border-2 ${routeEnd}`} /></div><div className="min-w-0 text-right"><p className={`text-[10px] font-bold uppercase tracking-[0.16em] ${muted}`}>To</p><p className="mt-1 text-sm font-bold">{shipment.destination.split(",")[0]}</p></div></div>
        <div className={`relative mt-5 flex items-center justify-between border-t pt-4 ${rule}`}><div><p className={`text-[10px] font-bold uppercase tracking-[0.16em] ${muted}`}>Estimated arrival</p><p className="mt-1 text-sm font-bold">{shipment.eta}</p></div><ArrowUpRight className="size-5 opacity-50 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></div>
      </div>
      <div className="-mt-1 mx-6 h-3 rounded-b-[18px] bg-brand-secondary/80" /><div className="-mt-1 mx-10 h-3 rounded-b-[18px] bg-cargo-yellow/80" />
    </button>
  );
}

export function Timeline({ shipment }: { shipment: Shipment }) {
  return <div className="relative mt-5 space-y-0">{shipment.events.map((event, index) => <div key={`${event.label}-${index}`} className="relative flex gap-4 pb-6 last:pb-0"><div className={`relative z-10 mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${event.complete ? "border-ink bg-cargo-yellow text-ink" : event.current ? "border-cargo-yellow bg-ink text-cargo-yellow" : "border-white/25 bg-ink text-white"}`}>{event.complete ? <Check className="size-3" strokeWidth={3} /> : event.current ? <span className="size-2 rounded-full bg-cargo-yellow" /> : <span className="size-1.5 rounded-full bg-white/30" />}</div>{index < shipment.events.length - 1 && <div className={`absolute left-[9px] top-6 h-[calc(100%-12px)] w-px ${event.complete ? "bg-cargo-yellow/80" : "border-l border-dashed border-white/20"}`} /> }<div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><div><p className={`text-sm font-semibold ${event.current ? "text-white" : event.complete ? "text-white/80" : "text-white/45"}`}>{event.label}</p><p className="mt-1 text-xs text-white/40">{event.detail}</p></div><span className="whitespace-nowrap text-[11px] text-white/35">{event.time}</span></div></div></div>)}</div>;
}

export function ShipmentActions({ shipment, onReschedule }: { shipment: Shipment; onReschedule?: () => void }) {
  const copyTracking = () => { navigator.clipboard?.writeText(shipment.trackingNumber); toast.success("Tracking number copied"); };
  const shareTracking = () => { navigator.share?.({ title: "Track my New World Cargo shipment", text: shipment.trackingNumber, url: window.location.href }).catch(() => undefined); toast("Tracking link ready to share"); };
  const isDelayed = shipment.status === "delayed";
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><button onClick={copyTracking} className="flex items-center justify-center gap-2 rounded-2xl bg-white/8 px-3 py-3 text-xs font-bold text-white/75 transition hover:bg-white/12"><Copy className="size-4" />Copy ID</button><button onClick={shareTracking} className="flex items-center justify-center gap-2 rounded-2xl bg-white/8 px-3 py-3 text-xs font-bold text-white/75 transition hover:bg-white/12"><Share2 className="size-4" />Share</button>{(isDelayed || shipment.status === "out_for_delivery") && <button onClick={onReschedule} className="col-span-2 flex items-center justify-center gap-2 rounded-2xl bg-cargo-yellow px-3 py-3 text-xs font-bold text-ink transition hover:brightness-105 sm:col-span-2"><RefreshCw className="size-4" />Reschedule delivery</button>}{!isDelayed && shipment.status !== "out_for_delivery" && <button onClick={() => toast("Delivery instructions can be added before the courier leaves.")} className="col-span-2 flex items-center justify-center gap-2 rounded-2xl bg-cargo-yellow px-3 py-3 text-xs font-bold text-ink transition hover:brightness-105 sm:col-span-2"><MapPin className="size-4" />Delivery instructions</button>}</div>;
}

export function CompactShipmentRow({ shipment, onOpen }: { shipment: Shipment; onOpen?: () => void }) {
  return <button onClick={onOpen} className="flex w-full items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.035] p-3 text-left transition hover:border-white/18 hover:bg-white/[0.06]"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/8"><PackageCheck className="size-5 text-cargo-yellow" /></div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-bold">{shipment.trackingNumber}</p><StatusBadge status={shipment.status} label={shipment.statusLabel} small /></div><p className="mt-1 truncate text-xs text-white/42">{shipment.origin.split(",")[0]} → {shipment.destination.split(",")[0]} · {shipment.eta}</p></div><ChevronRight className="size-4 shrink-0 text-white/30" /></button>;
}

export function CargoRail({ label, items, active = 1 }: { label: string; items: string[]; active?: number }) {
  return <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3"><div className="mb-3 flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">{label}</span><span className="font-heading text-[10px] font-extrabold uppercase tracking-[0.18em] text-cargo-yellow">Live route</span></div><div className="flex items-start">{items.map((item, index) => <div key={item} className="flex min-w-0 flex-1 items-start"><div className="flex min-w-0 flex-1 flex-col items-center"><span className={`size-2.5 rounded-full border-2 ${index < active ? "border-ink bg-cargo-yellow" : index === active ? "border-cargo-yellow bg-ink shadow-[0_0_0_4px_rgba(255,200,61,0.18)]" : "border-white/25 bg-ink"}`} /><span className={`mt-2 truncate text-[9px] font-semibold ${index === active ? "text-white" : index < active ? "text-white/55" : "text-white/25"}`}>{item}</span></div>{index < items.length - 1 && <span className={`mt-1.5 h-px flex-1 ${index < active ? "bg-cargo-yellow/70" : "border-t border-dashed border-white/15"}`} />}</div>)}</div></div>;
}
