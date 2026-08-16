import { Camera, CheckCircle2, Copy, PackageSearch, Share2, XCircle } from "lucide-react";
import { useState } from "react";
import { shipments } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { matchesTrackingNumber } from "@/lib/workflow-completion";

type ScanState = "idle" | "permission" | "ready";

export default function Tracking() {
  const [code, setCode] = useState("");
  const [searched, setSearched] = useState(false);
  const [scanState, setScanState] = useState<ScanState>("idle");
  const result = shipments.find((shipment) => matchesTrackingNumber(shipment.trackingNumber, code));

  const startScan = () => {
    setScanState("permission");
    window.setTimeout(() => setScanState("ready"), 450);
  };

  const useSampleScan = () => {
    setCode("NWC48291ZM");
    setSearched(true);
    setScanState("idle");
  };

  return (
    <main className="min-h-screen bg-white px-4 py-8 text-ink sm:px-6">
      <div className="mx-auto max-w-2xl">
        <header className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-cargo-yellow"><PackageSearch className="size-5" /></span>
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-cargo-yellow">New World Cargo</p><h1 className="font-heading text-3xl font-extrabold">Track a shipment</h1></div>
        </header>
        <form onSubmit={(event) => { event.preventDefault(); setSearched(true); }} className="mt-8 flex flex-col gap-3 sm:flex-row">
          <input autoFocus value={code} onChange={(event) => { setCode(event.target.value); setSearched(false); }} placeholder="Enter tracking number, e.g. NWC48291ZM" className="h-13 min-w-0 flex-1 rounded-2xl border border-ink/15 px-4 text-sm font-semibold outline-none focus:border-cargo-yellow" />
          <Button className="h-13 rounded-2xl bg-cargo-yellow font-bold text-ink">Track shipment</Button>
        </form>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button onClick={startScan} className="inline-flex items-center gap-2 text-xs font-bold text-ink/65 hover:text-ink"><Camera className="size-4 text-cargo-yellow" />Scan a tracking QR code</button>
          {scanState === "permission" && <span className="text-xs text-ink/50">Requesting camera permission…</span>}
          {scanState === "ready" && <div className="flex flex-wrap items-center gap-2 text-xs text-ink/55"><span>Camera is ready.</span><button onClick={useSampleScan} className="font-bold text-ink underline decoration-cargo-yellow">Use sample scan</button><button onClick={() => setScanState("idle")} className="font-bold text-ink/55">Cancel</button></div>}
        </div>
        {searched && !result && <section className="mt-6 rounded-[26px] border border-ink/10 bg-[#f7f8fb] p-6 text-center"><XCircle className="mx-auto size-8 text-ink/45" /><p className="mt-3 text-sm font-bold">Shipment not found</p><p className="mt-1 text-xs leading-5 text-ink/55">Check the tracking number and try again. If it was just created, allow a few minutes for the first scan.</p></section>}
        {result && <section className="mt-6 rounded-[28px] border border-ink/10 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-ink/45">{result.trackingNumber}</p><h2 className="mt-1 text-lg font-extrabold">{result.packageName}</h2><p className="mt-1 text-xs text-ink/55">{result.origin} → {result.destination}</p></div><span className="rounded-full bg-cargo-yellow/25 px-3 py-1 text-xs font-bold">{result.statusLabel}</span></div><div className="mt-6 space-y-4">{result.events.map((event, index) => <div key={`${event.label}-${index}`} className="flex gap-3"><span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${event.complete || event.current ? "bg-cargo-yellow text-ink" : "border border-ink/20 bg-white"}`}>{(event.complete || event.current) && <CheckCircle2 className="size-3" />}</span><div><p className="text-sm font-bold">{event.label}</p><p className="mt-0.5 text-xs text-ink/55">{event.detail} · {event.time}</p></div></div>)}</div><div className="mt-6 flex flex-wrap gap-2"><Button onClick={() => navigator.clipboard?.writeText(result.trackingNumber)} variant="outline" className="rounded-xl font-bold"><Copy className="mr-2 size-4" />Copy number</Button><Button onClick={() => navigator.share?.({ title: "New World Cargo tracking", text: result.trackingNumber })} variant="outline" className="rounded-xl font-bold"><Share2 className="mr-2 size-4" />Share tracking</Button></div></section>}
        <p className="mt-8 text-center text-xs text-ink/45">Need help? Contact New World Cargo support by phone or email.</p>
      </div>
    </main>
  );
}
