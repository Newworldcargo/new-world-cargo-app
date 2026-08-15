// Design reminder: This customer-first home screen leads with bookings, delivery management, payment, and support on a true-white minimalist canvas.
import {
  ArrowRight,
  Camera,
  ChevronRight,
  CircleHelp,
  CreditCard,
  MapPin,
  PackageCheck,
  PackagePlus,
  ReceiptText,
  ScanLine,
  Search,
  ShieldCheck,
  Sparkles,
  Truck,
  WalletCards,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { shipments } from "@/lib/mock-data";
import { ShipmentCard, StatusBadge } from "@/components/shipment-ui";

export default function Home() {
  const [, navigate] = useLocation();
  const [tracking, setTracking] = useState("");
  const arriving = shipments[1];
  const inTransit = shipments[0];

  const track = () => {
    if (!tracking.trim()) {
      toast.error("Enter a tracking number to continue");
      return;
    }
    navigate(`/shipments/${tracking.toUpperCase().includes("19034") ? "shipment-19034" : "shipment-48291"}`);
  };

  const primaryActions = [
    {
      label: "Track another package",
      detail: "Search by tracking number",
      icon: Search,
      onClick: () => document.getElementById("tracking-rail")?.scrollIntoView({ behavior: "smooth", block: "center" }),
      accent: "bg-cargo-yellow text-ink border-cargo-yellow",
    },
    {
      label: "Pay balance",
      detail: "K 1,280 due for China cargo",
      icon: WalletCards,
      onClick: () => navigate("/account"),
      accent: "bg-white text-foreground border-ink/10",
    },
    {
      label: "Add delivery note",
      detail: "For your arriving parcel",
      icon: PackageCheck,
      onClick: () => navigate(`/shipments/${arriving.id}`),
      accent: "bg-white text-foreground border-ink/10",
    },
    {
      label: "Get help",
      detail: "Talk to cargo support",
      icon: CircleHelp,
      onClick: () => toast("New World Cargo support is online 24/7."),
      accent: "bg-white text-foreground border-ink/10",
    },
  ];

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl overflow-x-hidden">
      <section className="border-b border-ink/10 pb-6 sm:pb-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-cargo-yellow">
              <span className="size-2 rounded-full bg-cargo-yellow" /> Your cargo desk
            </p>
            <h1 className="mt-3 font-heading text-3xl font-extrabold tracking-[-0.05em] text-foreground sm:text-4xl">
              Good afternoon, Amina.
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">
              Your bookings, deliveries, and next actions are all here.
            </p>
          </div>
          <button
            onClick={() => navigate("/send")}
            className="inline-flex items-center gap-2 rounded-2xl border border-cargo-yellow bg-cargo-yellow px-4 py-3 text-xs font-bold text-ink transition hover:brightness-[1.02]"
          >
            <PackagePlus className="size-4" /> Start a shipment
          </button>
        </div>
      </section>

      <section className="mt-6 grid min-w-0 gap-5 lg:grid-cols-[1.18fr_0.82fr]">
        <button
          onClick={() => navigate(`/shipments/${arriving.id}`)}
          className="group rounded-[28px] border border-ink/10 bg-white p-5 text-left transition hover:border-cargo-yellow/45 sm:p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">Your next delivery</p>
              <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight text-foreground">{arriving.eta}</h2>
              <p className="mt-2 text-sm font-semibold text-white/60">{arriving.packageName} · {arriving.trackingNumber}</p>
            </div>
            <StatusBadge status={arriving.status} label={arriving.statusLabel} />
          </div>
          <div className="mt-7 flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-2xl bg-cargo-yellow/30 text-ink"><Truck className="size-5" /></div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-foreground">Courier is nearby</p>
              <p className="mt-1 truncate text-xs text-white/55">{arriving.destination} · Add instructions if needed</p>
            </div>
            <ChevronRight className="size-5 text-cargo-yellow transition group-hover:translate-x-0.5" />
          </div>
        </button>

        <div className="rounded-[28px] border border-ink/10 bg-[#f7f8fb] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">Wallet & payments</p>
              <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight text-foreground">K 1,280 due</h2>
              <p className="mt-2 text-sm leading-6 text-white/55">For your Guangzhou to Lusaka order.</p>
            </div>
            <div className="grid size-10 place-items-center rounded-2xl bg-cargo-yellow/15 text-cargo-yellow"><CreditCard className="size-5" /></div>
          </div>
          <button
            onClick={() => navigate("/account")}
            className="mt-6 flex w-full items-center justify-between rounded-2xl border border-ink/10 bg-white px-4 py-3 text-left text-xs font-bold text-foreground transition hover:border-cargo-yellow/70"
          >
            Review payment <ArrowRight className="size-4 text-cargo-yellow" />
          </button>
        </div>
      </section>

      <section className="mt-6 min-w-0">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">What would you like to do?</p>
            <h2 className="mt-1 font-heading text-xl font-bold tracking-tight text-foreground">Manage your order</h2>
          </div>
          <button onClick={() => navigate("/shipments")} className="flex items-center gap-1 text-xs font-bold text-cargo-yellow">All bookings <ChevronRight className="size-4" /></button>
        </div>
        <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-4">
          {primaryActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={action.onClick}
                className={`group min-h-[128px] rounded-[22px] border p-4 text-left transition hover:border-cargo-yellow/55 ${action.accent}`}
              >
                <Icon className="size-5 opacity-80" strokeWidth={1.8} />
                <div className="mt-6 flex items-end justify-between gap-2">
                  <div><p className="text-xs font-bold leading-4">{action.label}</p><p className="mt-1 text-[10px] font-medium leading-4 opacity-65">{action.detail}</p></div>
                  <ArrowRight className="size-4 shrink-0 opacity-45 transition group-hover:translate-x-0.5" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-9 grid min-w-0 gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="mb-4 flex items-end justify-between">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">Open bookings</p><h2 className="mt-1 font-heading text-2xl font-bold tracking-tight text-foreground">Keep an eye on it</h2></div>
            <button onClick={() => navigate("/shipments")} className="flex items-center gap-1 text-xs font-bold text-cargo-yellow">View all <ChevronRight className="size-4" /></button>
          </div>
          <ShipmentCard shipment={inTransit} onOpen={() => navigate(`/shipments/${inTransit.id}`)} />
        </div>

        <div id="tracking-rail" className="min-w-0 overflow-hidden rounded-[28px] border border-ink/10 bg-[#f7f8fb] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">Find a booking</p><h2 className="mt-1 font-heading text-xl font-bold tracking-tight text-foreground">Track another package</h2></div><MapPin className="size-5 text-cargo-yellow" /></div>
          <div className="mt-5 rounded-2xl border border-ink/10 bg-white p-2"><div className="flex items-center gap-2 px-3"><Search className="size-5 text-ink/45" /><input value={tracking} onChange={(event) => setTracking(event.target.value)} onKeyDown={(event) => event.key === "Enter" && track()} placeholder="Enter tracking number" className="h-12 min-w-0 flex-1 bg-transparent text-sm font-semibold text-ink outline-none placeholder:text-ink/40" aria-label="Tracking number" /><button onClick={track} className="grid size-10 place-items-center rounded-full bg-ink text-white transition hover:bg-ink/80" aria-label="Track package"><ScanLine className="size-5" /></button></div></div>
          <div className="mt-3 flex items-center justify-between px-1 text-[11px] text-white/55"><span>Try NWC48291ZM</span><button onClick={() => toast("Camera scanning will be available in the installed app.")} className="flex items-center gap-1.5 font-semibold text-cargo-yellow"><Camera className="size-3.5" />Scan QR</button></div>
        </div>
      </section>

      <section className="mt-10 rounded-[28px] border border-ink/10 bg-[#f7f8fb] p-5 sm:p-7">
        <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-cargo-yellow"><Sparkles className="size-4" /> More with New World Cargo</div>
            <h2 className="mt-3 font-heading text-2xl font-bold tracking-tight text-foreground">Need to send something new?</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">Create a local delivery or arrange a China shipment when you are ready.</p>
          </div>
          <div className="flex flex-wrap gap-2"><button onClick={() => navigate("/quote")} className="inline-flex items-center gap-2 rounded-2xl border border-ink/10 bg-white px-4 py-3 text-xs font-bold text-foreground transition hover:border-cargo-yellow/70"><ReceiptText className="size-4" /> Get a quote</button><button onClick={() => navigate("/send")} className="inline-flex items-center gap-2 rounded-2xl border border-cargo-yellow bg-cargo-yellow px-4 py-3 text-xs font-bold text-ink transition hover:brightness-[1.02]"><PackagePlus className="size-4" /> New shipment</button></div>
        </div>
      </section>

      <section className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ink/10 bg-white px-4 py-3">
        <div className="flex items-center gap-3"><div className="grid size-8 place-items-center rounded-xl bg-cargo-yellow/25 text-ink"><ShieldCheck className="size-4" /></div><span className="text-xs font-semibold text-white/70">Need help with a booking or delivery?</span></div>
        <button onClick={() => toast("New World Cargo support is online 24/7.")} className="text-xs font-bold text-cargo-yellow">Talk to support</button>
      </section>
    </div>
  );
}
