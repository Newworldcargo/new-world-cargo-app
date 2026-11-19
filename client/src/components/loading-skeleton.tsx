import { useIsMutating } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

export type SkeletonVariant = "list" | "cards" | "detail" | "form" | "dashboard" | "payment-detail" | "profiles";

export function skeletonVariant(path: string): SkeletonVariant {
  if (path === "/") return "dashboard";
  if (path === "/payments/suppliers/new") return "form";
  if (path.startsWith("/payments/suppliers/")) return "payment-detail";
  if (path === "/payments") return "cards";
  if (/^\/shipments\/[^/]+/.test(path) && path !== "/shipments/drafts") return "detail";
  if (/tracking|\/track/.test(path)) return "detail";
  if (/^\/(send|quote|pickups|returns|login|register|recover-account|forgot-password|reset-password|verify|auth)/.test(path)) return "form";
  if (path === "/shipments" || path === "/shipments/drafts") return "cards";
  return "list";
}

function Lines() {
  return <div className="min-w-0 flex-1 space-y-3"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-5/6" /><Skeleton className="h-3 w-1/3" /></div>;
}

export function ContentSkeleton({ variant = "list", rows = 3, label = "Loading your details" }: { variant?: SkeletonVariant; rows?: number; label?: string }) {
  return <section role="status" aria-label={label} aria-busy="true" className="w-full min-w-0" data-loading-variant={variant}>
    <span className="sr-only">{label}</span>
    {variant === "payment-detail" ? <div aria-hidden="true" className="grid gap-5 md:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)]">
      <div className="space-y-4 rounded-2xl border border-ink/10 bg-[#edf3f8] p-5">
        <Skeleton className="h-3 w-24" /><Skeleton className="h-8 w-40 max-w-full" />
        <Skeleton className="h-3 w-2/3" /><Skeleton className="h-3 w-3/4" />
      </div>
      <div className="divide-y divide-ink/10">
        {Array.from({ length: 4 }, (_, index) => <div key={index} className="flex justify-between gap-4 py-3"><Skeleton className="h-3 w-24" /><Skeleton className="h-3 w-28" /></div>)}
      </div>
    </div> : variant === "profiles" ? <div aria-hidden="true" className="flex gap-3 overflow-hidden">
      {Array.from({ length: rows }, (_, index) => <div key={index} className="grid shrink-0 justify-items-center gap-2 px-2 py-1.5">
        <Skeleton className="size-14 rounded-full" /><Skeleton className="h-3 w-14" />
      </div>)}
    </div> : <div aria-hidden="true" className={variant === "cards" || variant === "dashboard" ? "grid gap-5 sm:grid-cols-2" : "space-y-5"}>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className={variant === "cards" || variant === "dashboard" ? "min-h-52 space-y-6 rounded-lg border border-gray-200 bg-white p-5" : "flex min-h-24 gap-4 border-b border-gray-100 py-5"}>
          {variant === "form" ? <div className="w-full space-y-3"><Skeleton className="h-3 w-28" /><Skeleton className="h-12 w-full" /></div> : <><Skeleton className="size-10 shrink-0 rounded-lg" /><Lines /></>}
          {(variant === "cards" || variant === "dashboard") && <Skeleton className="h-9 w-full" />}
        </div>
      ))}
      {variant === "detail" && <Skeleton className="h-48 w-full" />}
    </div>}
  </section>;
}

export function InlineSkeleton({ className = "h-4 w-24" }: { className?: string }) {
  return <span aria-hidden="true" className={"inline-block max-w-full rounded-md bg-ink/10 align-middle motion-safe:animate-pulse " + className} />;
}

export function RefreshProgress({ label }: { label: string }) {
  return <span role="status" className="inline-flex items-center gap-2 text-xs font-medium">
    <Loader2 aria-hidden="true" className="size-3.5 shrink-0 motion-safe:animate-spin" />{label}
  </span>;
}

export function PageSkeleton({ path = typeof window === "undefined" ? "/" : window.location.pathname, variant, label = "Loading page" }: { path?: string; variant?: SkeletonVariant; label?: string }) {
  return <div className="mx-auto w-full max-w-6xl space-y-8" data-page-skeleton>
    <div aria-hidden="true" className="space-y-3"><Skeleton className="h-8 w-48 max-w-full" /><Skeleton className="h-4 w-80 max-w-full" /></div>
    <ContentSkeleton variant={variant ?? skeletonVariant(path)} label={label} />
  </div>;
}

// Keep forms and existing data visible while a write request is in flight.
export function MutationProgress() {
  const pending = useIsMutating();
  if (!pending) return null;
  return <div role="status" aria-label="Saving changes" className="pointer-events-none fixed inset-x-0 top-0 z-[210] h-1 bg-gray-100">
    <span className="sr-only">Saving changes</span>
    <div aria-hidden="true" className="h-full w-full bg-cargo-yellow motion-safe:animate-pulse motion-reduce:animate-none" />
  </div>;
}
