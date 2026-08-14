// New World Cargo style reminder: Poppins, dark command-center canvas, Cargo Yellow action color, lavender route accents, mobile-first.

import { Filter, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { CompactShipmentRow, ShipmentCard } from "@/components/shipment-ui";
import { shipments } from "@/lib/mock-data";

export default function Shipments() {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "delivered">("all");
  const filtered = useMemo(() => shipments.filter((s) => `${s.trackingNumber} ${s.packageName} ${s.destination}`.toLowerCase().includes(query.toLowerCase())).filter((s) => filter === "all" ? true : filter === "active" ? s.status !== "delivered" : s.status === "delivered"), [query, filter]);
  return <div className="mx-auto max-w-6xl"><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-cargo-yellow">Workspace</p><h1 className="mt-2 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">Shipments</h1><p className="mt-2 text-sm text-white/45">Every package, one calm view.</p></div><button onClick={() => navigate("/send")} className="flex items-center justify-center gap-2 rounded-2xl bg-cargo-yellow px-4 py-3 text-sm font-bold text-ink transition hover:brightness-105"><span className="text-lg leading-none">+</span> Send a package</button></div>
    <div className="mt-8 flex flex-col gap-3 sm:flex-row"><div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.035] px-4"><Search className="size-4 text-white/35" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by tracking number or destination" className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-white/30" /></div><div className="flex gap-2 rounded-2xl bg-white/[0.035] p-1"><button onClick={() => setFilter("all")} className={`rounded-xl px-4 py-2 text-xs font-bold ${filter === "all" ? "bg-white text-ink" : "text-white/45"}`}>All</button><button onClick={() => setFilter("active")} className={`rounded-xl px-4 py-2 text-xs font-bold ${filter === "active" ? "bg-white text-ink" : "text-white/45"}`}>Active</button><button onClick={() => setFilter("delivered")} className={`rounded-xl px-4 py-2 text-xs font-bold ${filter === "delivered" ? "bg-white text-ink" : "text-white/45"}`}>Delivered</button></div><button onClick={() => setFilter("all")} className="grid size-12 place-items-center rounded-2xl border border-white/8 bg-white/[0.035] text-white/50 hover:text-white" aria-label="Reset filters"><SlidersHorizontal className="size-4" /></button></div>
    <div className="mt-8 grid gap-5 lg:grid-cols-2">{filtered.length ? filtered.map((shipment, index) => <div key={shipment.id} className={index === 0 ? "lg:col-span-2 lg:max-w-[620px]" : ""}><ShipmentCard shipment={shipment} onOpen={() => navigate(`/shipments/${shipment.id}`)} /></div>) : <div className="col-span-full rounded-[28px] border border-dashed border-white/15 p-10 text-center"><Filter className="mx-auto size-6 text-white/30" /><p className="mt-3 font-heading font-bold">No shipments match that search</p><p className="mt-1 text-sm text-white/40">Try another tracking number or clear the filter.</p></div>}</div>
    <div className="mt-8 flex items-center gap-2 text-xs text-white/30"><div className="size-1.5 rounded-full bg-mint" /> Tracking updates refresh automatically in your customer account.</div>
  </div>;
}

