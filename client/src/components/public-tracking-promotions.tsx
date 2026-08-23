import { ArrowUpRight, Plane, Warehouse } from "lucide-react";

export const PUBLIC_TRACKING_PROMOTIONS = [
  {
    eyebrow: "Air cargo",
    title: "Moving time-sensitive cargo?",
    detail: "Explore a practical air-cargo option for faster international consignments.",
    icon: Plane,
    imageSrc: "/manus-storage/new-world-cargo-logistics-promotion_9de81ef0.jpeg",
    imageAlt: "Aircraft on an airport freight apron at sunset",
    imagePosition: "object-center",
  },
  {
    eyebrow: "Warehouse support",
    title: "Need a secure holding point?",
    detail: "See how New World Cargo can support cargo before its next delivery step.",
    icon: Warehouse,
    imageSrc: "/manus-storage/new-world-cargo-freight-promotion_23a7c2ce.jpg",
    imageAlt: "A customer handing over a packed parcel",
    imagePosition: "object-[center_57%]",
  },
] as const;

/**
 * A small service-discovery area for signed-out tracking visitors.
 * It intentionally sits below tracking so promotion never competes with lookup.
 */
export function PublicTrackingPromotions() {
  return (
    <section aria-labelledby="explore-services" className="mt-10 border-t border-ink/10 pt-7">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-ink/45">Explore New World Cargo</p>
          <h2 id="explore-services" className="mt-1 font-heading text-xl font-extrabold">
            Services for your next shipment
          </h2>
        </div>
        <a
          href="https://www.newworldcargo.com/"
          target="_blank"
          rel="noreferrer"
          className="shrink-0 text-xs font-bold text-ink underline decoration-cargo-yellow underline-offset-4"
        >
          View all
        </a>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {PUBLIC_TRACKING_PROMOTIONS.map((promotion) => {
          const Icon = promotion.icon;
          return (
            <a
              key={promotion.title}
              href="https://www.newworldcargo.com/"
              target="_blank"
              rel="noreferrer"
              className="group relative min-h-48 overflow-hidden rounded-[26px] bg-ink p-5 text-white transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cargo-yellow"
            >
              <img
                src={promotion.imageSrc}
                alt={promotion.imageAlt}
                className={`absolute inset-0 size-full object-cover opacity-65 transition-transform duration-300 group-hover:scale-[1.03] ${promotion.imagePosition}`}
              />
              <span aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-ink via-ink/78 to-ink/28" />
              <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 bg-cargo-yellow" />
              <span className="relative flex h-full flex-col">
                <span className="flex items-start justify-between gap-3">
                  <Icon className="size-5" aria-hidden="true" />
                  <ArrowUpRight
                    className="size-5 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden="true"
                  />
                </span>
                <span className="mt-auto block pt-7">
                  <span className="block text-xs font-bold text-white/80">{promotion.eyebrow}</span>
                  <span className="mt-1 block font-heading text-lg font-extrabold">{promotion.title}</span>
                  <span className="mt-2 block text-sm leading-5 text-white/85">{promotion.detail}</span>
                </span>
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}
