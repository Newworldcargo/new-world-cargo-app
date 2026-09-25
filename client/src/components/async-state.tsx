import { AlertTriangle, CloudOff, Inbox, RefreshCw } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { feedback } from "@/lib/feedback";
import { PageSkeleton, type SkeletonVariant } from "./loading-skeleton";

type StateAction = { label: string; onClick: () => void };

export const APP_PRELOADER_LABEL = "Loading New World Cargo…";

function StateFrame({ icon, title, detail, action }: { icon: ReactNode; title: string; detail: string; action?: StateAction }) {
  return <section className="grid min-h-52 place-items-center rounded-[28px] border border-ink/10 bg-white p-6 text-center"><div className="max-w-sm"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-cargo-yellow text-ink">{icon}</span><h2 className="mt-4 font-heading text-lg font-extrabold text-ink">{title}</h2><p className="mt-2 text-sm leading-6 text-ink/55">{detail}</p>{action && <button onClick={action.onClick} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cargo-yellow px-4 py-2.5 text-sm font-bold text-ink transition hover:brightness-105"><RefreshCw className="size-4" />{action.label}</button>}</div></section>;
}

export function AppPreloader({ label = APP_PRELOADER_LABEL }: { label?: string }) {
  return <div className="min-h-screen bg-white p-4 pt-12 sm:p-8"><PageSkeleton label={label} /></div>;
}

export function LoadingState({ label = "Loading your details…", variant }: { label?: string; variant?: SkeletonVariant }) { return <PageSkeleton label={label} variant={variant} />; }
export function EmptyState({ title, detail, action }: { title: string; detail: string; action?: StateAction }) { return <StateFrame icon={<Inbox className="size-5" />} title={title} detail={detail} action={action} />; }
export function ErrorState({ title = "We could not load this yet", detail = "Please check your connection and try again.", action }: { title?: string; detail?: string; action?: StateAction }) {
  useEffect(() => { feedback.error(title, { description: detail }); }, [detail, title]);
  return <StateFrame icon={<AlertTriangle className="size-5" />} title={title} detail={detail} action={action} />;
}

export function OfflineBanner() {
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  const previousOnline = useRef(online);
  useEffect(() => { const update = () => setOnline(navigator.onLine); window.addEventListener("online", update); window.addEventListener("offline", update); return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); }; }, []);
  useEffect(() => {
    if (previousOnline.current === online) return;
    previousOnline.current = online;
    if (online) feedback.success("You are back online", { description: "You can continue with new requests and updates." });
    else feedback.warning("You are offline", { description: "Saved details remain available; new changes will need a connection." });
  }, [online]);
  if (online) return null;
  return <div role="status" className="fixed inset-x-3 top-3 z-[100] mx-auto flex max-w-xl items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-center text-sm font-semibold text-white shadow-lg"><CloudOff className="size-4 shrink-0 text-cargo-yellow" />You are offline. Saved details remain available; new changes will need a connection.</div>;
}
