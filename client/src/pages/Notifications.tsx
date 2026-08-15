import { Bell, Clock3, MapPin, PackageCheck, WalletCards } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { filterNotifications } from "@/lib/customer-workflow";

const notifications = [
  { id: 1, type: "progress", title: "Your package is in transit", body: "NWC48291ZM is moving through our delivery network.", time: "12 min ago", icon: PackageCheck, color: "text-ink", bg: "bg-cargo-yellow/15", shipment: "shipment-48291", unread: true },
  { id: 2, type: "arrival", title: "Courier is nearby", body: "NWC19034ZM is arriving today in Ndola.", time: "1 hr ago", icon: MapPin, color: "text-cargo-yellow", bg: "bg-cargo-yellow/15", shipment: "shipment-19034", unread: true },
  { id: 3, type: "exception", title: "Delivery needs your attention", body: "We couldn't reach the recipient for NWC77120ZM.", time: "Yesterday", icon: Clock3, color: "text-ink", bg: "bg-ink/10", shipment: "shipment-77120", unread: false },
  { id: 4, type: "payment", title: "Payment confirmed", body: "Your receipt for NWC48291ZM is ready to view.", time: "12 Aug", icon: WalletCards, color: "text-cargo-yellow", bg: "bg-cargo-yellow/15", shipment: "shipment-48291", unread: false },
];

type Filter = "unread" | "read";

export default function Notifications() {
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState<Filter>("unread");
  const filteredNotifications = filterNotifications(notifications, filter);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cargo-yellow">Stay in the loop</p>
          <h1 className="mt-2 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">Notifications</h1>
          <p className="mt-2 text-sm text-white/45">The next useful thing, right when you need it.</p>
        </div>
        <button className="hidden text-xs font-bold text-white/40 hover:text-white sm:block">Mark all read</button>
      </div>

      <div className="mt-7 inline-flex rounded-2xl border border-white/10 bg-white/[0.03] p-1" role="tablist" aria-label="Notification filter">
        {(["unread", "read"] as Filter[]).map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={filter === item}
            onClick={() => setFilter(item)}
            className={`rounded-xl px-5 py-2.5 text-xs font-bold capitalize transition ${filter === item ? "bg-cargo-yellow text-ink" : "text-white/45 hover:text-white"}`}
          >
            {item} <span className="ml-1 opacity-60">{filterNotifications(notifications, item).length}</span>
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {filteredNotifications.length ? filteredNotifications.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} onClick={() => navigate(`/shipments/${item.shipment}`)} className={`flex w-full gap-4 rounded-[24px] border p-4 text-left transition hover:border-cargo-yellow/50 sm:p-5 ${item.unread ? "border-white/12 bg-white/[0.045]" : "border-white/7 bg-white/[0.02]"}`}>
              <div className={`grid size-11 shrink-0 place-items-center rounded-2xl ${item.bg} ${item.color}`}><Icon className="size-5" /></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3"><p className="text-sm font-bold">{item.title}</p>{item.unread && <span className="mt-1 size-2 shrink-0 rounded-full bg-cargo-yellow" />}</div>
                <p className="mt-1 text-sm leading-5 text-white/45">{item.body}</p>
                <p className="mt-3 text-[11px] text-white/25">{item.time}</p>
              </div>
            </button>
          );
        }) : (
          <div className="rounded-[24px] border border-dashed border-white/12 p-8 text-center text-sm text-white/45">No {filter} notifications.</div>
        )}
      </div>

      <div className="mt-8 flex items-center gap-3 rounded-2xl border border-cargo-yellow/15 bg-cargo-yellow/6 p-4 text-xs text-white/45"><Bell className="size-4 text-cargo-yellow" />We’ll notify you when something changes.</div>
    </div>
  );
}
