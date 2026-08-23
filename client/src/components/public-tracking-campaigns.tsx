import { ArrowUpRight, PackageCheck, Route, ShieldCheck } from "lucide-react";

export const PUBLIC_TRACKING_CAMPAIGNS = {
  banner: {
    eyebrow: "New World Cargo services",
    title: "Moving cargo across borders?",
    detail: "Explore air cargo, sea freight, warehousing, and local delivery support.",
  },
  left: {
    eyebrow: "Air & sea cargo",
    title: "Plan your next shipment",
    detail: "Find a service that fits your route, cargo, and delivery timeline.",
    icon: Route,
  },
  right: {
    eyebrow: "Cargo support",
    title: "Keep every step clear",
    detail: "From collection to final delivery, our team is ready to help.",
    icon: ShieldCheck,
  },
} as const;

const SERVICES_URL = "https://www.newworldcargo.com/";

/**
 * First-party campaign inventory for the public tracking page.
 * It deliberately contains no third-party script, targeting, or advertising network code.
 */
export function PublicTrackingCampaignBanner() {
  const campaign = PUBLIC_TRACKING_CAMPAIGNS.banner;

  return (
    <aside
      aria-label="New World Cargo services"
      className="mb-8 hidden overflow-hidden rounded-[28px] border border-ink/10 bg-ink px-6 py-5 text-white xl:block"
    >
      <div className="flex items-center justify-between gap-6">
        <div className="min-w-0">
          <p className="text-xs font-bold text-cargo-yellow">{campaign.eyebrow}</p>
          <h2 className="mt-1 font-heading text-xl font-extrabold">{campaign.title}</h2>
          <p className="mt-1 text-sm text-white/75">{campaign.detail}</p>
        </div>
        <a
          href={SERVICES_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-cargo-yellow px-4 py-3 text-sm font-bold text-ink transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cargo-yellow"
        >
          Explore services <ArrowUpRight className="size-4" aria-hidden="true" />
        </a>
      </div>
    </aside>
  );
}

export function PublicTrackingCampaignColumn({ side }: { side: "left" | "right" }) {
  const campaign = PUBLIC_TRACKING_CAMPAIGNS[side];
  const Icon = campaign.icon;

  return (
    <aside aria-label={`${campaign.eyebrow} campaign`} className="hidden xl:block">
      <div className="sticky top-6 rounded-[26px] border border-ink/10 bg-[#f7f8fb] p-5">
        <span className="grid size-10 place-items-center rounded-2xl bg-cargo-yellow text-ink">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <p className="mt-6 text-xs font-bold text-ink/50">{campaign.eyebrow}</p>
        <h2 className="mt-1 font-heading text-xl font-extrabold leading-tight text-ink">{campaign.title}</h2>
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
