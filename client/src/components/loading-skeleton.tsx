import { useIsMutating } from "@tanstack/react-query";
import { Skeleton } from "./ui/skeleton";

export type SkeletonVariant = "list" | "cards" | "detail" | "form" | "dashboard";

export function skeletonVariant(path: string): SkeletonVariant {
  if (path === "/") return "dashboard";
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
    <div aria-hidden="true" className={variant === "cards" || variant === "dashboard" ? "grid gap-5 sm:grid-cols-2" : "space-y-5"}>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className={variant === "cards" || variant === "dashboard" ? "min-h-52 space-y-6 rounded-lg border border-gray-200 bg-white p-5" : "flex min-h-24 gap-4 border-b border-gray-100 py-5"}>
          {variant === "form" ? <div className="w-full space-y-3"><Skeleton className="h-3 w-28" /><Skeleton className="h-12 w-full" /></div> : <><Skeleton className="size-10 shrink-0 rounded-lg" /><Lines /></>}
          {(variant === "cards" || variant === "dashboard") && <Skeleton className="h-9 w-full" />}
        </div>
      ))}
      {variant === "detail" && <Skeleton className="h-48 w-full" />}
    </div>
  </section>;
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
