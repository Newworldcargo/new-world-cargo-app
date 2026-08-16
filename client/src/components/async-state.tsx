import { AlertTriangle, CloudOff, Inbox, RefreshCw } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";

type StateAction = { label: string; onClick: () => void };

export const APP_PRELOADER_LABEL = "Loading New World Cargo…";

function StateFrame({ icon, title, detail, action }: { icon: ReactNode; title: string; detail: string; action?: StateAction }) {
  return <section className="grid min-h-52 place-items-center rounded-[28px] border border-ink/10 bg-white p-6 text-center"><div className="max-w-sm"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-cargo-yellow text-ink">{icon}</span><h2 className="mt-4 font-heading text-lg font-extrabold text-ink">{title}</h2><p className="mt-2 text-sm leading-6 text-ink/55">{detail}</p>{action && <button onClick={action.onClick} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cargo-yellow px-4 py-2.5 text-sm font-bold text-ink transition hover:brightness-105"><RefreshCw className="size-4" />{action.label}</button>}</div></section>;
}

export function AppPreloader({ label = APP_PRELOADER_LABEL }: { label?: string }) {
  return <section className="fixed inset-0 z-[200] grid place-items-center bg-white" role="status" aria-live="polite" aria-label={label}>
    <div className="flex flex-col items-center gap-4 text-ink">
      <div className="relative size-12 animate-spin" aria-hidden="true">
        <span className="absolute left-1/2 top-0 h-3 w-1 -translate-x-1/2 rounded-full bg-cargo-yellow" />
        <span className="absolute right-0 top-1/2 h-1 w-3 -translate-y-1/2 rounded-full bg-cargo-yellow" />
        <span className="absolute bottom-0 left-1/2 h-3 w-1 -translate-x-1/2 rounded-full bg-cargo-yellow" />
        <span className="absolute left-0 top-1/2 h-1 w-3 -translate-y-1/2 rounded-full bg-cargo-yellow" />
      </div>
      <span className="text-sm font-semibold text-ink/55">{label}</span>
    </div>
  </section>;
}

export function LoadingState({ label = "Loading your details…" }: { label?: string }) { return <section className="grid min-h-52 place-items-center rounded-[28px] border border-ink/10 bg-white"><div className="flex items-center gap-3 text-sm font-semibold text-ink/60"><div className="size-4 animate-spin rounded-full border-2 border-cargo-yellow border-t-transparent" aria-hidden="true" />{label}</div></section>; }
export function EmptyState({ title, detail, action }: { title: string; detail: string; action?: StateAction }) { return <StateFrame icon={<Inbox className="size-5" />} title={title} detail={detail} action={action} />; }
export function ErrorState({ title = "We could not load this yet", detail = "Please check your connection and try again.", action }: { title?: string; detail?: string; action?: StateAction }) { return <StateFrame icon={<AlertTriangle className="size-5" />} title={title} detail={detail} action={action} />; }

export function OfflineBanner() {
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  useEffect(() => { const update = () => setOnline(navigator.onLine); window.addEventListener("online", update); window.addEventListener("offline", update); return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); }; }, []);
  if (online) return null;
  return <div role="status" className="fixed inset-x-3 top-3 z-[100] mx-auto flex max-w-xl items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-center text-sm font-semibold text-white shadow-lg"><CloudOff className="size-4 shrink-0 text-cargo-yellow" />You are offline. Saved details remain available; new changes will need a connection.</div>;
}
