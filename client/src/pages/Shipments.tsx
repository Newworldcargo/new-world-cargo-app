// New World Cargo style reminder: Poppins, dark command-center canvas, Cargo Yellow action color, navy route accents, mobile-first.

import { FilePenLine, Filter, Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { ShipmentCard } from "@/components/shipment-ui";
import { useCustomerDrafts, useCustomerShipments } from "@/api/hooks";
import { useCustomerBookings } from "@/api/bookings";
import { shipmentPipeline } from "@/lib/shipment-pipeline";

export default function Shipments() {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "delivered">("all");
  const {
    data: shipments = [],
    isLoading,
    isError,
    refetch,
  } = useCustomerShipments({ query, status: filter }, { refetchInterval: 30_000 });
  const bookingsQuery = useCustomerBookings();
  const filtered = shipmentPipeline(shipments, bookingsQuery.data ?? [], query, filter);
  const loading = isLoading || bookingsQuery.isLoading;
  const hasError = isError || bookingsQuery.isError;
  const draftsQuery = useCustomerDrafts();
  const drafts = draftsQuery.data ?? [];
  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
            Shipments
          </h1>
          <p className="mt-2 text-sm text-white/45">
            Confirmed cargo and requests waiting for confirmation.
          </p>
        </div>
        <button
          onClick={() => navigate("/send")}
          className="flex items-center justify-center gap-2 rounded-2xl bg-cargo-yellow px-4 py-3 text-sm font-bold text-ink transition hover:brightness-105"
        >
          <span className="text-lg leading-none">+</span> Send a package
        </button>
      </div>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.035] px-4">
          <Search className="size-4 text-white/35" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by tracking number or destination"
            className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-white/30"
          />
        </div>
        <div className="flex gap-2 rounded-2xl bg-white/[0.035] p-1">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-xl px-4 py-2 text-xs font-bold ${filter === "all" ? "bg-white text-ink" : "text-white/45"}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("active")}
            className={`rounded-xl px-4 py-2 text-xs font-bold ${filter === "active" ? "bg-white text-ink" : "text-white/45"}`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter("delivered")}
            className={`rounded-xl px-4 py-2 text-xs font-bold ${filter === "delivered" ? "bg-white text-ink" : "text-white/45"}`}
          >
            Delivered
          </button>
        </div>
        <button
          onClick={() => setFilter("all")}
          className="grid size-12 place-items-center rounded-2xl border border-white/8 bg-white/[0.035] text-white/50 hover:text-white"
          aria-label="Reset filters"
        >
          <SlidersHorizontal className="size-4" />
        </button>
      </div>
      {!draftsQuery.isLoading && drafts.length > 0 && (
        <section className="mt-6 rounded-[28px] border border-cargo-yellow/30 bg-cargo-yellow/10 p-5 sm:flex sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-cargo-yellow text-ink">
              <FilePenLine className="size-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-white">
                {drafts.length} unfinished {drafts.length === 1 ? "draft" : "drafts"}
              </p>
              <p className="mt-1 text-xs text-white/55">
                These drafts have not been submitted.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/shipments/drafts")}
            className="mt-4 w-full rounded-xl bg-cargo-yellow px-4 py-2.5 text-sm font-bold text-ink sm:mt-0 sm:w-auto"
          >
            View drafts
          </button>
        </section>
      )}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-extrabold">
            Your shipments
          </h2>
          <span className="text-xs text-white/40">{filtered.length} shown</span>
        </div>
        {hasError && <div role="alert" className="mb-4 text-sm">
          <p>Some shipments could not be loaded.</p>
          <button onClick={() => { void refetch(); void bookingsQuery.refetch(); }} className="mt-2 font-bold underline">Try again</button>
        </div>}
        <div className="grid gap-5 lg:grid-cols-2">
          {loading && !filtered.length ? (
            <div className="col-span-full rounded-[28px] border border-dashed border-white/15 p-10 text-center text-sm text-white/45">
              Loading shipments linked to your account…
            </div>
          ) : filtered.length ? (
            filtered.map(item => (
              <div key={item.key}>
                <ShipmentCard
                  shipment={item.card}
                  onOpen={() => navigate(`/shipments/${item.id}`)}
                />
              </div>
            ))
          ) : !hasError ? (
            <div className="col-span-full rounded-[28px] border border-dashed border-white/15 p-10 text-center">
              <Filter className="mx-auto size-6 text-white/30" />
              <p className="mt-3 font-heading font-bold">
                {query || filter !== "all" ? "No shipments match your filters" : "No shipments yet"}
              </p>
              <p className="mt-1 text-sm text-white/40">
                {query || filter !== "all" ? "Try another search or select All." : "Submitted bookings appear here while awaiting approval."}
              </p>
              {drafts.length > 0 && (
                <button
                  onClick={() => navigate("/shipments/drafts")}
                  className="mt-4 text-sm font-bold text-cargo-yellow"
                >
                  View your saved requests
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>
      <div className="mt-8 flex items-center gap-2 text-xs text-white/30">
        <div className="size-1.5 rounded-full bg-cargo-yellow" /> Tracking
        updates refresh automatically in your customer account.
      </div>
    </div>
  );
}
