import { ArrowUpRight, Route, ShieldCheck } from "lucide-react";

const SERVICES_URL = "https://www.newworldcargo.com/";

export const PUBLIC_TRACKING_BRAND_ASSETS = {
  logo: "/manus-storage/new-world-cargo-tracking-logo_1248486d.svg",
  campaignSquare: "/manus-storage/new-world-cargo-campaign-111_144a01f3.jpg",
  campaignWarehouse: "/manus-storage/new-world-cargo-warehouse-campaign_fa33d540.jpg",
} as const;

export const PUBLIC_TRACKING_CARD_THEME = {
  surfaceClass: "bg-[#012642]",
  copyClass: "text-white/72",
} as const;

export const PUBLIC_TRACKING_SERVICES = [
  {
    eyebrow: "Air & sea cargo",
    title: "Plan your next shipment",
    detail: "Find a service that fits your route, cargo, and delivery timeline.",
    icon: Route,
  },
  {
    eyebrow: "Cargo support",
    title: "Keep every step clear",
    detail: "From collection to final delivery, our team is ready to help.",
    icon: ShieldCheck,
  },
] as const;

export const PUBLIC_TRACKING_RAILS = {
  left: {
    eyebrow: "Sea freight",
    title: "Plan your next move",
    detail: "Bring your next cargo shipment into view before it starts its journey.",
    imageUrl: PUBLIC_TRACKING_BRAND_ASSETS.campaignWarehouse,
  },
  right: {
    eyebrow: "New World Cargo",
    title: "Move with confidence",
    detail: "A dedicated campaign space for current services, offers, and customer support.",
    imageUrl: PUBLIC_TRACKING_BRAND_ASSETS.campaignSquare,
  },
} as const;

/**
 * First-party New World Cargo promotional inventory. It contains no third-party
 * advertising, targeting, or ad-network script and is deliberately hidden on mobile.
 */
export function PublicTrackingCampaignRail({ side }: { side: "left" | "right" }) {
  const campaign = PUBLIC_TRACKING_RAILS[side];

  return (
    <aside
      aria-label={`${campaign.eyebrow} campaign rail`}
      data-campaign-rail={side}
      className="relative hidden min-h-screen overflow-hidden bg-ink xl:block"
    >
      <img src={campaign.imageUrl} alt="" aria-hidden="true" className="absolute inset-0 size-full object-cover" />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-[#012642]/45 via-[#012642]/72 to-[#012642]/95" />
      <div className="relative z-10 flex min-h-screen w-full items-end p-6">
        <div className="w-full border-y border-white/25 py-6">
          <p className="text-xs font-bold text-cargo-yellow">{campaign.eyebrow}</p>
          <h2 className="mt-2 font-heading text-2xl font-extrabold leading-tight text-white">{campaign.title}</h2>
          <p className="mt-3 text-sm leading-6 text-white/75">{campaign.detail}</p>
          <a
            href={SERVICES_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-white underline decoration-cargo-yellow decoration-2 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cargo-yellow"
          >
            Learn more <ArrowUpRight className="size-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </aside>
  );
}

export function PublicTrackingServiceCards() {
  return (
    <section aria-label="New World Cargo services" className="mt-10 grid gap-3 sm:grid-cols-2">
      {PUBLIC_TRACKING_SERVICES.map((service) => {
        const Icon = service.icon;

        return (
          <article key={service.title} className={`rounded-[22px] border border-white/10 p-5 ${PUBLIC_TRACKING_CARD_THEME.surfaceClass}`}>
            <span className="grid size-10 place-items-center rounded-2xl bg-cargo-yellow text-ink">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <p className="mt-5 text-xs font-bold text-cargo-yellow">{service.eyebrow}</p>
            <h2 className="mt-1 font-heading text-lg font-extrabold text-white">{service.title}</h2>
            <p className={`mt-2 text-sm leading-6 ${PUBLIC_TRACKING_CARD_THEME.copyClass}`}>{service.detail}</p>
            <a
              href={SERVICES_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-white underline decoration-cargo-yellow decoration-2 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cargo-yellow"
            >
              Learn more <ArrowUpRight className="size-4" aria-hidden="true" />
            </a>
          </article>
        );
      })}
    </section>
  );
}
