import { ArrowUpRight, Route, ShieldCheck } from "lucide-react";

const SERVICES_URL = "https://www.newworldcargo.com/";

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
    eyebrow: "New World Cargo",
    title: "Plan your next move",
    detail: "A dedicated campaign space for air, sea, and local delivery services.",
  },
  right: {
    eyebrow: "Cargo support",
    title: "Make every step easier",
    detail: "A dedicated campaign space for services, offers, and customer support.",
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
      className="hidden min-h-screen border-x border-ink/10 bg-[#f7f8fb] px-5 py-8 xl:flex xl:justify-center"
    >
      <div className="sticky top-8 h-fit w-full max-w-48 border-y border-ink/10 py-6">
        <p className="text-xs font-bold text-cargo-yellow">{campaign.eyebrow}</p>
        <h2 className="mt-2 font-heading text-xl font-extrabold leading-tight text-ink">{campaign.title}</h2>
        <p className="mt-3 text-sm leading-6 text-ink/65">{campaign.detail}</p>
        <a
          href={SERVICES_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-ink underline decoration-cargo-yellow decoration-2 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cargo-yellow"
        >
          Learn more <ArrowUpRight className="size-4" aria-hidden="true" />
        </a>
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
          <article key={service.title} className="rounded-[22px] border border-ink/10 p-5">
            <span className="grid size-10 place-items-center rounded-2xl bg-cargo-yellow text-ink">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <p className="mt-5 text-xs font-bold text-ink/50">{service.eyebrow}</p>
            <h2 className="mt-1 font-heading text-lg font-extrabold text-ink">{service.title}</h2>
            <p className="mt-2 text-sm leading-6 text-ink/65">{service.detail}</p>
            <a
              href={SERVICES_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-ink underline decoration-cargo-yellow decoration-2 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cargo-yellow"
            >
              Learn more <ArrowUpRight className="size-4" aria-hidden="true" />
            </a>
          </article>
        );
      })}
    </section>
  );
}
