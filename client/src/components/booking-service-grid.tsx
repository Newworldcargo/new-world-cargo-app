import { ArrowUpRight } from "lucide-react";
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
