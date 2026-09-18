import { ArrowUpRight, Bike, Globe2, SlidersHorizontal, Truck } from "lucide-react";
import { useLocation } from "wouter";

export type BookingService = "import" | "intercity" | "local" | "custom";

export const bookingStartPath: Record<BookingService, string> = {
  import: "/send/import/route",
  intercity: "/send/intercity/route",
  local: "/send/local/route",
  custom: "/send/custom/route",
};

const services: Array<{
  id: BookingService;
  title: string;
  subtitle?: string;
  capacity?: string;
  image?: string;
  variant: "compact" | "wide" | "custom";
}> = [
  {
    id: "import",
    title: "International Imports",
    subtitle: "From any country",
    image: "/services/cargo-parcel-transparent.png",
    variant: "compact",
  },
  {
    id: "intercity",
    title: "City-to-City",
    subtitle: "Between cities",
    image: "/services/new-world-truck.png",
    variant: "compact",
  },
  {
    id: "local",
    title: "Local Delivery",
    subtitle: "Within your city",
    capacity: "< 100 kg",
    image: "/services/new-world-scooter.png",
    variant: "wide",
  },
  {
    id: "custom",
    title: "Custom Request",
    variant: "custom",
  },
];

const serviceTabs = [
  { id: "import" as const, label: "International", mobileLabel: "Imports", icon: Globe2 },
  { id: "intercity" as const, label: "City-to-City", mobileLabel: "City-to-City", icon: Truck },
  { id: "local" as const, label: "Local", mobileLabel: "Local", icon: Bike },
  { id: "custom" as const, label: "Custom", mobileLabel: "Custom", icon: SlidersHorizontal },
];

export function BookingServiceTabs({ selected, onSelect }: { selected?: BookingService; onSelect: (service: BookingService) => void }) {
  return (
    <div role="tablist" aria-label="Shipment service">
      <div className="grid grid-cols-4 gap-1.5 rounded-2xl border border-ink/10 bg-[#f3f6f8] p-1.5 sm:gap-2">
        {serviceTabs.map(({ id, label, mobileLabel, icon: Icon }) => {
          const active = id === selected;
          return <button key={id} type="button" role="tab" aria-selected={active} aria-label={label} onClick={() => onSelect(id)} className={`flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-bold transition sm:min-h-11 sm:flex-row sm:gap-2 sm:px-3 sm:text-xs ${active ? "sea-cargo-surface" : "text-ink/60 hover:bg-white hover:text-foreground"}`}><Icon className="size-4 shrink-0" /><span className="sm:hidden">{mobileLabel}</span><span className="hidden sm:inline">{label}</span></button>;
        })}
      </div>
    </div>
  );
}

export function BookingServiceGrid({
  heading = true,
  onSelect,
}: {
  heading?: boolean;
  onSelect?: (service: BookingService) => void;
}) {
  const [, navigate] = useLocation();
  const select = (service: BookingService) => {
    if (onSelect) onSelect(service);
    else navigate(bookingStartPath[service]);
  };

  return (
    <section aria-labelledby={heading ? "booking-service-heading" : undefined}>
      {heading && (
        <h2
          id="booking-service-heading"
          className="mb-3 font-heading text-xl font-extrabold text-foreground"
        >
          Where are you sending?
        </h2>
      )}
      <div className="grid grid-cols-6 gap-2.5 sm:gap-3">
        {services.map(service => {
          const isCustom = service.variant === "custom";
          const width =
            service.variant === "compact"
              ? "col-span-3"
              : service.variant === "wide"
                ? "col-span-4"
                : "col-span-2";
          return (
            <button
              key={service.id}
              type="button"
              onClick={() => select(service.id)}
              aria-label={`Choose ${service.title}`}
              className={`group relative ${width} overflow-hidden border p-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cargo-yellow sm:p-4 ${
                service.variant === "compact"
                  ? "min-h-[116px] rounded-[20px]"
                  : "min-h-[142px] rounded-[24px]"
              } ${isCustom ? "border-brand-secondary bg-brand-secondary text-white" : "border-[#e3e9eb] bg-white hover:border-cargo-yellow"}`}
            >
              <span className="relative z-10 block max-w-[78%]">
                <span
                  className={`block font-heading font-extrabold ${service.variant === "compact" ? "text-sm leading-[18px]" : "text-base leading-[21px]"} ${isCustom ? "!text-white" : "text-foreground"}`}
                >
                  {service.title}
                </span>
                {service.subtitle && (
                  <span className="mt-0.5 block text-xs font-medium text-ink/55">
                    {service.subtitle}
                  </span>
                )}
              </span>
              {service.capacity && (
                <span className="absolute bottom-4 left-4 z-10 text-[11px] font-semibold text-foreground">
                  {service.capacity}
                </span>
              )}
              {service.image ? (
                <img
                  src={service.image}
                  alt=""
                  aria-hidden="true"
                  className={`pointer-events-none absolute object-contain transition-transform duration-200 group-hover:scale-[1.03] ${
                    service.variant === "wide"
                      ? "-bottom-2 -right-6 h-32 w-40"
                      : "-bottom-1 -right-1 h-[62px] w-20"
                  }`}
                />
              ) : (
                <ArrowUpRight className="absolute bottom-3 right-3 size-10 text-white transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
