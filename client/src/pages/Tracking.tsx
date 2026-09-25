import { ContentSkeleton } from "@/components/loading-skeleton";
import { CheckCircle2, Copy, PackageSearch, Share2, UserRound, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { usePublicTracking } from "@/api/hooks";
import {
  PUBLIC_TRACKING_BRAND_ASSETS,
  PublicTrackingCampaignRail,
  PublicTrackingServiceCards,
} from "@/components/public-tracking-campaigns";
import { Button } from "@/components/ui/button";
import { CustomerApiError } from "@/api/errors";
export { getReachedTrackingEvents } from "@/lib/tracking-timeline";

export const TRACKING_TIMELINE_CONNECTOR_CLASS = "absolute left-2.5 top-5 bottom-0 z-20 border-l-[3px] border-dashed";
export const PUBLIC_TRACKING_SIGN_IN_LABEL = "Sign in to your account";

export function getTrackingTimelineConnectorClass(isComplete: boolean) {
  return `${TRACKING_TIMELINE_CONNECTOR_CLASS} ${isComplete ? "border-cargo-yellow" : "border-ink/20"}`;
}

export const shouldRenderTrackingConnector = (eventIndex: number, eventCount: number) => eventIndex < eventCount - 1;

export const isTrackingTimelineSegmentComplete = (events: Array<{ complete?: boolean; current?: boolean }>, eventIndex: number) => Boolean(events[eventIndex]?.complete || events[eventIndex]?.current);

export default function Tracking() {
  const [code, setCode] = useState("");
  const [searched, setSearched] = useState(false);
  const [inputError, setInputError] = useState("");
  const trackingNumber = code.trim().toUpperCase();
  const { data: result, isLoading, isError, error, refetch } = usePublicTracking(searched ? trackingNumber : "");
  const parcelNotFound = error instanceof CustomerApiError && error.status === 404;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const queryCode = params.get("code") || params.get("number");
    const pathMatch = window.location.pathname.match(/\/shipments\/tracking\/([^/?#]+)/i);
    const seedCode = decodeURIComponent((queryCode || pathMatch?.[1] || "").trim()).toUpperCase();

    if (!seedCode) return;

    setCode(seedCode);
    setInputError("");
    setSearched(true);
  }, []);

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
                <div className="min-w-0">
                  <img
                    src={PUBLIC_TRACKING_BRAND_ASSETS.logo}
                    alt="New World Cargo"
                    className="h-7 w-auto max-w-36 object-contain object-left"
                  />
                  <h1 className="font-heading text-3xl font-extrabold">Track a shipment</h1>
                </div>
              </div>
              <Link
                href="/login"
                aria-label={PUBLIC_TRACKING_SIGN_IN_LABEL}
                className="inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-ink underline decoration-cargo-yellow underline-offset-4"
              >
                <UserRound aria-hidden="true" className="size-4" />
                <span>Sign in</span>
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

            {searched && isLoading && (
              <div className="mt-6"><ContentSkeleton variant="detail" label="Looking up your shipment" /></div>
            )}
            {searched && isError && parcelNotFound && (
              <section className="mt-6 rounded-[26px] border border-ink/10 bg-[#f7f8fb] p-6 text-center">
                <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-cargo-yellow text-ink"><PackageSearch className="size-5" /></span>
                <p className="mt-4 text-sm font-extrabold">We could not find that parcel</p>
                <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-ink/55">We checked the cargo desk and under the conveyor belt too—<strong>{trackingNumber}</strong> is not in the tracking system yet.</p>
                <p className="mt-2 text-xs text-ink/45">Check the parcel code, or give a newly created shipment a few minutes for its first scan.</p>
              </section>
            )}
            {searched && isError && !parcelNotFound && (
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
                    <h2 className="mt-1 text-lg font-extrabold">Parcel owner: {result.parcelOwner || "Not recorded"}</h2>
                    <p className="mt-1 text-xs text-ink/55">
                      {result.origin} → {result.destination}
                    </p>
                  </div>
                  <span className="rounded-full bg-cargo-yellow/25 px-3 py-1 text-xs font-bold">{result.statusLabel}</span>
                </div>
                <div className="mt-6 rounded-2xl bg-ink p-4 text-white">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/55">Delivery progress</p>
                  <div className="mt-4 flex items-center gap-3"><div className="min-w-0 flex-1"><p className="text-xs font-bold text-white">{result.origin}</p><p className="mt-1 text-[11px] text-white/55">Origin</p></div><div className="flex flex-1 items-center gap-1"><span className="size-2 rounded-full bg-cargo-yellow" /><span className="h-0.5 flex-1 bg-cargo-yellow" /><span className="size-2 rounded-full border-2 border-white/70 bg-ink" /></div><div className="min-w-0 flex-1 text-right"><p className="text-xs font-bold text-white">{result.destination}</p><p className="mt-1 text-[11px] text-white/55">Destination</p></div></div>
                </div>
                <div className="relative mt-6">
                  {result.events.length > 0 ? result.events.map((event, index, events) => {
                    const reached = Boolean(event.complete || event.current);
                    const nextReached = Boolean(events[index + 1]?.complete || events[index + 1]?.current);

                    return (
                      <div key={`${event.label}-${index}`} aria-hidden={!reached} className={`relative flex gap-3 pb-7 last:pb-0 ${reached ? "" : "blur-[3px] opacity-40"}`}>
                        {shouldRenderTrackingConnector(index, events.length) && (
                          <span aria-hidden="true" className={getTrackingTimelineConnectorClass(nextReached)} />
                        )}
                        <span
                          className={`relative z-30 mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${reached ? "bg-cargo-yellow text-ink" : "border border-ink/20 bg-white"}`}
                        >
                          {reached && <CheckCircle2 className="size-3" />}
                        </span>
                        <div className="relative z-20">
                          <p className="text-sm font-bold">{event.label}</p>
                          <p className="mt-0.5 text-xs text-ink/55">{event.detail} · {event.time}</p>
                        </div>
                      </div>
                    );
                  }) : (
                    <p role="status" className="text-sm text-ink/55">No tracking updates yet.</p>
                  )}
                  {result.events.some((event) => !event.complete && !event.current) && (
                    <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-2/3 bg-gradient-to-t from-white via-white/65 to-transparent" />
                  )}
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
