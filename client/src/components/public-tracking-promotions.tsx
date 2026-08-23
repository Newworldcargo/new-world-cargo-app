import { ArrowUpRight, ShipWheel, Warehouse } from "lucide-react";

export const PUBLIC_TRACKING_PROMOTIONS = [
  {
    eyebrow: "Sea freight",
    title: "Moving larger cargo?",
    detail: "Explore a practical sea-freight option for larger international consignments.",
    icon: ShipWheel,
    className: "bg-ink text-white",
  },
  {
    eyebrow: "Warehouse support",
    title: "Need a secure holding point?",
    detail: "See how New World Cargo can support cargo before its next delivery step.",
    icon: Warehouse,
    className: "bg-cargo-yellow text-ink",
  },
] as const;

/**
 * A small service-discovery area for signed-out tracking visitors.
 * It intentionally sits below tracking so promotion never competes with lookup.
 */
export function PublicTrackingPromotions() {
  return <section aria-labelledby="explore-services" className="mt-10 border-t border-ink/10 pt-7">
    <div className="flex items-end justify-between gap-4">
      <div><p className="text-xs font-bold text-ink/45">Explore New World Cargo</p><h2 id="explore-services" className="mt-1 font-heading text-xl font-extrabold">Services for your next shipment</h2></div>
      <a href="https://www.newworldcargo.com/" target="_blank" rel="noreferrer" className="shrink-0 text-xs font-bold text-ink underline decoration-cargo-yellow underline-offset-4">View all</a>
    </div>
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {PUBLIC_TRACKING_PROMOTIONS.map((promotion) => {
        const Icon = promotion.icon;
        return <a key={promotion.title} href="https://www.newworldcargo.com/" target="_blank" rel="noreferrer" className={`group min-h-44 rounded-[26px] p-5 transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cargo-yellow ${promotion.className}`}>
          <div className="flex items-start justify-between gap-3"><Icon className="size-5" aria-hidden="true" /><ArrowUpRight className="size-5 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" /></div>
          <p className="mt-7 text-xs font-bold opacity-70">{promotion.eyebrow}</p><h3 className="mt-1 font-heading text-lg font-extrabold">{promotion.title}</h3><p className="mt-2 text-sm leading-5 opacity-75">{promotion.detail}</p>
        </a>;
      })}
    </div>
  </section>;
}
