import { Camera, CheckCircle2, Copy, PackageSearch, Share2, XCircle } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { usePublicTracking } from "@/api/hooks";
import { PublicTrackingCampaignRail, PublicTrackingServiceCards } from "@/components/public-tracking-campaigns";
import { Button } from "@/components/ui/button";

type ScanState = "idle" | "permission" | "ready";

export default function Tracking() {
  const [code, setCode] = useState("");
  const [searched, setSearched] = useState(false);
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [inputError, setInputError] = useState("");
  const trackingNumber = code.trim().toUpperCase();
  const { data: result, isLoading, isError, refetch } = usePublicTracking(searched ? trackingNumber : "");

  const submitTracking = (event: React.FormEvent) => {
    event.preventDefault();
    if (!trackingNumber) {
      setSearched(false);
      setInputError("Enter your tracking number to continue.");
      return;
    }
    setInputError("");
    setSearched(true);
  };

  const startScan = () => {
    setScanState("permission");
    window.setTimeout(() => setScanState("ready"), 450);
  };

  const useSampleScan = () => {
    setCode("NWC48291ZM");
    setInputError("");
    setSearched(true);
    setScanState("idle");
  };

  return (
    <main className="min-h-screen bg-white text-ink">
      <div className="xl:grid xl:grid-cols-[minmax(12rem,1fr)_minmax(0,44rem)_minmax(12rem,1fr)]">
        <PublicTrackingCampaignRail side="left" />
        <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 xl:px-8">
            <header className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-11 place-items-center rounded-2xl bg-cargo-yellow">
                  <PackageSearch className="size-5" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-cargo-yellow">New World Cargo</p>
                  <h1 className="font-heading text-3xl font-extrabold">Track a shipment</h1>
                </div>
              </div>
              <Link href="/login" className="shrink-0 text-sm font-bold text-ink underline decoration-cargo-yellow underline-offset-4">
                Sign in
              </Link>
            </header>

            <form onSubmit={submitTracking} className="mt-8 flex flex-col gap-3 sm:flex-row" noValidate>
              <input
                autoFocus
                value={code}
                onChange={(event) => {
                  setCode(event.target.value);
                  setSearched(false);
                  setInputError("");
                }}
                placeholder="Enter tracking number, e.g. NWC48291ZM"
                aria-label="Tracking number"
                aria-invalid={Boolean(inputError)}
                aria-describedby={inputError ? "tracking-number-error" : undefined}
                className="h-13 min-w-0 flex-1 rounded-2xl border border-ink/15 px-4 text-sm font-semibold outline-none focus:border-cargo-yellow"
              />
              <Button className="h-13 rounded-2xl bg-cargo-yellow font-bold text-ink">Track shipment</Button>
            </form>
            {inputError && (
              <p id="tracking-number-error" role="alert" className="mt-2 text-sm font-semibold text-red-700">
                {inputError}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button onClick={startScan} className="inline-flex items-center gap-2 text-xs font-bold text-ink/65 hover:text-ink">
                <Camera className="size-4 text-cargo-yellow" />
                Scan a tracking QR code
              </button>
              {scanState === "permission" && <span className="text-xs text-ink/50">Requesting camera permission…</span>}
              {scanState === "ready" && (
                <div className="flex flex-wrap items-center gap-2 text-xs text-ink/55">
                  <span>Camera is ready.</span>
                  <button onClick={useSampleScan} className="font-bold text-ink underline decoration-cargo-yellow">
                    Use sample scan
                  </button>
                  <button onClick={() => setScanState("idle")} className="font-bold text-ink/55">
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {searched && isLoading && (
              <section className="mt-6 rounded-[26px] border border-ink/10 bg-[#f7f8fb] p-6 text-center text-sm text-ink/55">
                Looking up your shipment…
              </section>
            )}
            {searched && isError && (
              <section className="mt-6 rounded-[26px] border border-ink/10 bg-[#f7f8fb] p-6 text-center">
                <XCircle className="mx-auto size-8 text-ink/45" />
                <p className="mt-3 text-sm font-bold">Tracking is temporarily unavailable</p>
                <button onClick={() => refetch()} className="mt-3 text-xs font-bold text-ink underline decoration-cargo-yellow">
                  Try again
                </button>
              </section>
            )}
            {searched && !isLoading && !isError && !result && (
              <section className="mt-6 rounded-[26px] border border-ink/10 bg-[#f7f8fb] p-6 text-center">
                <XCircle className="mx-auto size-8 text-ink/45" />
                <p className="mt-3 text-sm font-bold">Shipment not found</p>
                <p className="mt-1 text-xs leading-5 text-ink/55">
                  Check the tracking number and try again. If it was just created, allow a few minutes for the first scan.
                </p>
              </section>
            )}
            {result && (
              <section className="mt-6 rounded-[28px] border border-ink/10 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-ink/45">{result.trackingNumber}</p>
                    <h2 className="mt-1 text-lg font-extrabold">{result.packageName}</h2>
                    <p className="mt-1 text-xs text-ink/55">
                      {result.origin} → {result.destination}
                    </p>
                  </div>
                  <span className="rounded-full bg-cargo-yellow/25 px-3 py-1 text-xs font-bold">{result.statusLabel}</span>
                </div>
                <div className="mt-6 space-y-4">
                  {result.events.map((event, index) => (
                    <div key={`${event.label}-${index}`} className="flex gap-3">
                      <span
                        className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${event.complete || event.current ? "bg-cargo-yellow text-ink" : "border border-ink/20 bg-white"}`}
                      >
                        {(event.complete || event.current) && <CheckCircle2 className="size-3" />}
                      </span>
                      <div>
                        <p className="text-sm font-bold">{event.label}</p>
                        <p className="mt-0.5 text-xs text-ink/55">
                          {event.detail} · {event.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Button onClick={() => navigator.clipboard?.writeText(result.trackingNumber)} variant="outline" className="rounded-xl font-bold">
                    <Copy className="mr-2 size-4" />
                    Copy number
                  </Button>
                  <Button
                    onClick={() => navigator.share?.({ title: "New World Cargo tracking", text: result.trackingNumber })}
                    variant="outline"
                    className="rounded-xl font-bold"
                  >
                    <Share2 className="mr-2 size-4" />
                    Share tracking
                  </Button>
                </div>
              </section>
            )}
            <p className="mt-8 text-center text-xs text-ink/45">Need help? Contact New World Cargo support by phone or email.</p>
            <PublicTrackingServiceCards />
        </div>
        <PublicTrackingCampaignRail side="right" />
        </div>
    </main>
  );
}
