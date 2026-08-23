import { Bell, Clock3, MapPin, PackageCheck, WalletCards } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { EmptyState, ErrorState, LoadingState } from "@/components/async-state";
import { useCustomerNotifications, useNotificationMutations } from "@/api/hooks";
import type { NotificationType } from "@/api/contracts";

type Filter = "unread" | "read";

const notificationStyle: Record<NotificationType, { icon: typeof PackageCheck; color: string; bg: string }> = {
  progress: { icon: PackageCheck, color: "text-ink", bg: "bg-cargo-yellow/15" },
  arrival: { icon: MapPin, color: "text-cargo-yellow", bg: "bg-cargo-yellow/15" },
  exception: { icon: Clock3, color: "text-ink", bg: "bg-ink/10" },
  payment: { icon: WalletCards, color: "text-cargo-yellow", bg: "bg-cargo-yellow/15" },
};

export default function Notifications() {
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState<Filter>("unread");
  const notificationsQuery = useCustomerNotifications();
  const notificationMutations = useNotificationMutations();
  const items = notificationsQuery.data ?? [];
  const filteredNotifications = items.filter((item) => filter === "unread" ? item.unread : !item.unread);
  const countFor = (value: Filter) => items.filter((item) => value === "unread" ? item.unread : !item.unread).length;

  const openNotification = (id: string, revision: number, shipmentId: string | null) => {
    notificationMutations.markRead.mutate({ id, revision }, { onSuccess: () => shipmentId ? navigate(`/shipments/${shipmentId}`) : undefined });
  };

  if (notificationsQuery.isLoading) return <LoadingState label="Loading notifications…" />;
  if (notificationsQuery.isError) return <ErrorState title="We could not load notifications" detail="Please try again." action={{ label: "Try again", onClick: () => notificationsQuery.refetch() }} />;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cargo-yellow">Stay in the loop</p>
          <h1 className="mt-2 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">Notifications</h1>
          <p className="mt-2 text-sm text-ink/55">The next useful thing, right when you need it.</p>
        </div>
        <button type="button" onClick={() => notificationMutations.markAllRead.mutate()} disabled={!items.some((item) => item.unread) || notificationMutations.markAllRead.isPending} className="hidden text-xs font-bold text-ink/55 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 sm:block">Mark all read</button>
      </div>

      <div className="mt-7 inline-flex rounded-2xl border border-ink/10 bg-ink/[0.03] p-1" role="tablist" aria-label="Notification filter">
        {(["unread", "read"] as Filter[]).map((item) => (
          <button key={item} type="button" role="tab" aria-selected={filter === item} onClick={() => setFilter(item)} className={`rounded-xl px-5 py-2.5 text-xs font-bold capitalize transition ${filter === item ? "bg-cargo-yellow text-ink" : "text-ink/55 hover:text-ink"}`}>
            {item} <span className="ml-1 opacity-60">{countFor(item)}</span>
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {filteredNotifications.length ? filteredNotifications.map((item) => {
          const Icon = notificationStyle[item.type].icon;
          return (
            <button key={item.id} type="button" onClick={() => openNotification(item.id, item.revision, item.shipmentId)} disabled={notificationMutations.markRead.isPending} className={`flex w-full gap-4 rounded-[24px] border p-4 text-left transition hover:border-cargo-yellow/50 disabled:cursor-wait sm:p-5 ${item.unread ? "border-ink/12 bg-ink/[0.045]" : "border-ink/7 bg-ink/[0.02]"}`}>
              <div className={`grid size-11 shrink-0 place-items-center rounded-2xl ${notificationStyle[item.type].bg} ${notificationStyle[item.type].color}`}><Icon className="size-5" /></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3"><p className="text-sm font-bold text-ink">{item.title}</p>{item.unread && <span className="mt-1 size-2 shrink-0 rounded-full bg-cargo-yellow" />}</div>
                <p className="mt-1 text-sm leading-5 text-ink/55">{item.body}</p>
                <p className="mt-3 text-[11px] text-ink/40">{item.displayTime}</p>
              </div>
            </button>
          );
        }) : <EmptyState title={`No ${filter} notifications`} detail="Updates for your shipments and payments will appear here." />}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cargo-yellow/15 bg-cargo-yellow/6 p-4 text-xs text-ink/55"><span className="flex items-center gap-3"><Bell className="size-4 text-cargo-yellow" />We’ll notify you when something changes.</span><button type="button" onClick={() => navigate("/settings/notifications")} className="font-bold text-ink hover:text-cargo-yellow">Notification preferences</button></div>
    </div>
  );
}
