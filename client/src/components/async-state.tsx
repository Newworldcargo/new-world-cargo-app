import { AlertTriangle, CloudOff, Inbox, Loader2, RefreshCw } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";

type StateAction = { label: string; onClick: () => void };

function StateFrame({ icon, title, detail, action }: { icon: ReactNode; title: string; detail: string; action?: StateAction }) {
  return <section className="grid min-h-52 place-items-center rounded-[28px] border border-ink/10 bg-white p-6 text-center"><div className="max-w-sm"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-cargo-yellow text-ink">{icon}</span><h2 className="mt-4 font-heading text-lg font-extrabold text-ink">{title}</h2><p className="mt-2 text-sm leading-6 text-ink/55">{detail}</p>{action && <button onClick={action.onClick} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cargo-yellow px-4 py-2.5 text-sm font-bold text-ink transition hover:brightness-105"><RefreshCw className="size-4" />{action.label}</button>}</div></section>;
}

export function LoadingState({ label = "Loading your details…" }: { label?: string }) { return <section className="grid min-h-52 place-items-center rounded-[28px] border border-ink/10 bg-white"><div className="flex items-center gap-3 text-sm font-semibold text-ink/60"><Loader2 className="size-5 animate-spin text-ink" />{label}</div></section>; }
export function EmptyState({ title, detail, action }: { title: string; detail: string; action?: StateAction }) { return <StateFrame icon={<Inbox className="size-5" />} title={title} detail={detail} action={action} />; }
export function ErrorState({ title = "We could not load this yet", detail = "Please check your connection and try again.", action }: { title?: string; detail?: string; action?: StateAction }) { return <StateFrame icon={<AlertTriangle className="size-5" />} title={title} detail={detail} action={action} />; }

export function OfflineBanner() {
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  useEffect(() => { const update = () => setOnline(navigator.onLine); window.addEventListener("online", update); window.addEventListener("offline", update); return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); }; }, []);
  if (online) return null;
  return <div role="status" className="fixed inset-x-3 top-3 z-[100] mx-auto flex max-w-xl items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-center text-sm font-semibold text-white shadow-lg"><CloudOff className="size-4 shrink-0 text-cargo-yellow" />You are offline. Saved details remain available; new changes will need a connection.</div>;
}
