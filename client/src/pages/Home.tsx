// New World Cargo style reminder: Poppins, dark command-center canvas, Cargo Yellow action color, lavender route accents, mobile-first.

import { ArrowRight, Camera, ChevronRight, MapPin, PackagePlus, ReceiptText, ScanLine, Search, ShieldCheck, Sparkles, Truck, WalletCards } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { ASSETS, shipments } from "@/lib/mock-data";
import { ShipmentCard } from "@/components/shipment-ui";

export default function Home() {
  const [, navigate] = useLocation();
  const [tracking, setTracking] = useState("");
  const active = shipments[0];
  const track = () => {
    if (!tracking.trim()) { toast.error("Enter a tracking number to continue"); return; }
    navigate("/shipments/" + (tracking.toUpperCase().includes("19034") ? "shipment-19034" : "shipment-48291"));
  };
  return <div className="mx-auto max-w-6xl">
    <section className="relative overflow-hidden rounded-[32px] border border-white/8 bg-[#202020] p-5 sm:p-8 lg:p-10">
      <div className="absolute inset-0 opacity-25" style={{ backgroundImage: `url(${ASSETS.route})`, backgroundPosition: "center", backgroundSize: "cover" }} />
      <div className="absolute inset-0 bg-gradient-to-r from-[#202020] via-[#202020]/95 to-[#202020]/50" />
      <div className="relative grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
        <div><div className="mb-7 flex items-center gap-2 text-xs font-semibold text-mint"><span className="size-2 rounded-full bg-mint" /> Welcome back, Amina</div><h1 className="max-w-xl font-heading text-[clamp(2.3rem,6vw,4.7rem)] font-extrabold leading-[0.98] tracking-[-0.06em]">Move it.<br /><span className="text-cargo-yellow">Follow it.</span><br />Feel in control.</h1><p className="mt-5 max-w-md text-sm leading-6 text-white/52 sm:text-base">Your shipments, their next stop, and the fastest way forward — all in one pocket-sized view.</p></div>
        <div className="lg:justify-self-end lg:max-w-[420px]">
          <div className="rounded-[24px] bg-white p-2 shadow-2xl"><div className="flex items-center gap-2 px-3"><Search className="size-5 text-ink/45" /><input value={tracking} onChange={(e) => setTracking(e.target.value)} onKeyDown={(e) => e.key === "Enter" && track()} placeholder="Track a package" className="h-12 min-w-0 flex-1 bg-transparent text-sm font-semibold text-ink outline-none placeholder:text-ink/40" aria-label="Tracking number" /><button onClick={track} className="grid size-10 place-items-center rounded-full bg-ink text-white transition hover:bg-ink/80" aria-label="Track package"><ScanLine className="size-5" /></button></div></div><div className="mt-3 flex items-center justify-between px-2 text-[11px] text-white/40"><span>Try NWC48291ZM</span><button onClick={() => toast("Camera scanning will be available in the installed app.")} className="flex items-center gap-1.5 font-semibold text-cargo-yellow"><Camera className="size-3.5" />Scan QR</button></div>
        </div>
      </div>
    </section>

    <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {[{ label: "Send package", icon: PackagePlus, href: "/send", accent: "bg-cargo-yellow text-ink" }, { label: "Get a quote", icon: ReceiptText, href: "/quote", accent: "bg-white/8 text-white" }, { label: "Pickup locations", icon: MapPin, href: "/shipments", accent: "bg-white/8 text-white" }, { label: "Pay balance", icon: WalletCards, href: "/account", accent: "bg-white/8 text-white" }].map((action) => { const Icon = action.icon; return <button key={action.label} onClick={() => action.href === "/shipments" ? toast("Pickup locations are ready to browse.") : navigate(action.href)} className={`group flex min-h-[100px] flex-col justify-between rounded-[22px] p-4 text-left transition hover:-translate-y-0.5 ${action.accent}`}><Icon className="size-5 opacity-80" strokeWidth={1.8} /><span className="flex items-center justify-between gap-2 text-xs font-bold leading-4">{action.label}<ArrowRight className="size-4 opacity-40 transition group-hover:translate-x-0.5" /></span></button>; })}
    </section>

    <section className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div><div className="mb-4 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-white/30">Your active shipments</p><h2 className="mt-2 font-heading text-2xl font-bold tracking-tight">Keep an eye on it</h2></div><button onClick={() => navigate("/shipments")} className="flex items-center gap-1 text-xs font-bold text-cargo-yellow">View all <ChevronRight className="size-4" /></button></div><ShipmentCard shipment={active} onOpen={() => navigate(`/shipments/${active.id}`)} /></div>
      <div className="lg:pt-[52px]"><div className="rounded-[28px] border border-white/8 bg-white/[0.035] p-5 sm:p-6"><div className="flex items-start justify-between"><div><div className="grid size-10 place-items-center rounded-2xl bg-mint/15 text-mint"><ShieldCheck className="size-5" /></div><h3 className="mt-5 font-heading text-xl font-bold">Shipping made clear.</h3><p className="mt-2 text-sm leading-6 text-white/48">From local deliveries to China imports, we keep every handoff visible.</p></div><Sparkles className="size-5 text-cargo-yellow" /></div><div className="mt-6 grid grid-cols-3 gap-2 border-t border-white/8 pt-5"><div><p className="font-heading text-xl font-extrabold">5k+</p><p className="mt-1 text-[10px] uppercase tracking-wider text-white/35">Delivered</p></div><div><p className="font-heading text-xl font-extrabold">98%</p><p className="mt-1 text-[10px] uppercase tracking-wider text-white/35">On-time</p></div><div><p className="font-heading text-xl font-extrabold">24/7</p><p className="mt-1 text-[10px] uppercase tracking-wider text-white/35">Support</p></div></div></div><div className="mt-3 flex items-center justify-between rounded-2xl border border-cargo-yellow/15 bg-cargo-yellow/8 px-4 py-3"><div className="flex items-center gap-3"><Truck className="size-4 text-cargo-yellow" /><span className="text-xs font-semibold text-white/70">Need help with a shipment?</span></div><button onClick={() => toast("Support is online 24/7.")} className="text-xs font-bold text-cargo-yellow">Talk to us</button></div></div>
    </section>
  </div>;
}

