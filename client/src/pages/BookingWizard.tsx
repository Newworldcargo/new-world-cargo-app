import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  FileText,
  MapPin,
  Package,
  Phone,
  Plane,
  Plus,
  Ship,
  SlidersHorizontal,
  Trash2,
  Truck,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { apiRequest } from "@/api/http";
import { useAuth } from "@/contexts/AuthContext";
import {
  useCustomerDrafts,
  useCustomerRecipients,
  useCustomerReferenceData,
  useShipmentDraftMutations,
} from "@/api/hooks";
import {
  BookingServiceTabs,
  bookingStartPath,
  type BookingService,
} from "@/components/booking-service-grid";
import {
  BookingRouteMap,
  type RouteMapOffice,
  type RouteMapPoint,
} from "@/components/booking-route-map";
import { feedback } from "@/lib/feedback";

type CargoRow = { id: number; name: string; quantity: string };
type Contact = { name: string; phone: string };
type BookingQuote = {
  source: "server";
  quotePayload: Record<string, unknown>;
  quoteSignature: string;
  formattedTotal: string;
};
type WizardDraft = {
  pickup: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  pickupBranchId: string;
  destination: string;
  destinationLatitude?: number;
  destinationLongitude?: number;
  destinationBranchId: string;
  transport: "air" | "sea";
  cargoRows: CargoRow[];
  cargoDescription: string;
  sender: Contact;
  receiver: Contact;
  supplier: Contact;
  instructions: string;
  fulfilment: "collection" | "door_delivery";
  schedule: "as_soon_as_possible" | "scheduled";
  scheduledAt: string;
  requestType: string;
  requestDetail: string;
  quote?: BookingQuote;
};

type Stage = { id: string; label: string; title: string; detail: string };

const journeys: Record<BookingService, { label: string; stages: Stage[] }> = {
  local: {
    label: "Local Delivery",
    stages: [
      {
        id: "route",
        label: "Route",
        title: "Where should we collect and deliver?",
        detail: "Add the pickup and delivery locations within your city.",
      },
      {
        id: "cargo",
        label: "Cargo",
        title: "Tell us about the cargo",
        detail: "List each item and quantity so we can plan the right vehicle.",
      },
      {
        id: "contacts",
        label: "Contacts",
        title: "Who sends and receives it?",
        detail: "We use these contacts to coordinate pickup and delivery.",
      },
      {
        id: "review",
        label: "Review",
        title: "Review delivery",
        detail: "Choose a pickup time and confirm the request.",
      },
    ],
  },
  intercity: {
    label: "City-to-City",
    stages: [
      {
        id: "route",
        label: "Route",
        title: "Which cities are you connecting?",
        detail: "Choose the New World Cargo origin and destination branches.",
      },
      {
        id: "cargo",
        label: "Cargo",
        title: "Tell us about the cargo",
        detail: "List the items moving between cities.",
      },
      {
        id: "contacts",
        label: "Contacts",
        title: "Who is sending and receiving?",
        detail: "Add contacts for collection and arrival updates.",
      },
      {
        id: "fulfilment",
        label: "Collection",
        title: "How should it be collected?",
        detail: "Choose branch collection or door delivery.",
      },
      {
        id: "review",
        label: "Review",
        title: "Review shipment",
        detail: "Check the route, cargo and collection preference.",
      },
    ],
  },
  import: {
    label: "International Imports",
    stages: [
      {
        id: "route",
        label: "Route & method",
        title: "Plan your international shipment",
        detail:
          "Choose origin and receiving branches, then select Air or Sea Freight.",
      },
      {
        id: "cargo",
        label: "Cargo",
        title: "Tell us about the cargo",
        detail: "Add the items being imported.",
      },
      {
        id: "receiver",
        label: "Receiver",
        title: "Who will receive the cargo?",
        detail:
          "Use the person or business responsible for collection or delivery.",
      },
      {
        id: "review",
        label: "Review",
        title: "Review your import",
        detail: "Check the details before requesting the international quote.",
      },
    ],
  },
  custom: {
    label: "Custom Request",
    stages: [
      {
        id: "route",
        label: "Route",
        title: "Where does this request start and end?",
        detail:
          "Add the route if your request involves collection and delivery.",
      },
      {
        id: "details",
        label: "Details",
        title: "What do you need us to arrange?",
        detail: "Describe the cargo move and give us a contact person.",
      },
      {
        id: "review",
        label: "Review",
        title: "Review custom request",
        detail:
          "Operations will assess the request and contact you with a quote.",
      },
    ],
  },
};

function freshDraft(
  user?: { firstName: string; lastName: string; phone: string },
  service?: BookingService
): WizardDraft {
  const customerContact = {
    name: user ? `${user.firstName} ${user.lastName}`.trim() : "",
    phone: user?.phone ?? "",
  };
  return {
    pickup: "",
    pickupLatitude: undefined,
    pickupLongitude: undefined,
    pickupBranchId: "",
    destination: "",
    destinationLatitude: undefined,
    destinationLongitude: undefined,
    destinationBranchId: "",
    transport: "air",
    cargoRows: [{ id: 1, name: "", quantity: "1" }],
    cargoDescription: "",
    sender: customerContact,
    receiver:
      service === "import" || service === "custom"
        ? customerContact
        : { name: "", phone: "" },
    supplier: { name: "", phone: "" },
    instructions: "",
    fulfilment: "collection",
    schedule: "as_soon_as_possible",
    scheduledAt: "",
    requestType: "",
    requestDetail: "",
  };
}

function storageKey(service: BookingService) {
  return `nwc-booking-wizard-${service}`;
}
function isService(value?: string): value is BookingService {
  return (
    value === "local" ||
    value === "intercity" ||
    value === "import" ||
    value === "custom"
  );
}

export default function BookingWizard() {
  const [, params] = useRoute<{ service: string; stage: string }>(
    "/send/:service/:stage"
  );
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const service = isService(params?.service) ? params.service : null;
  const journey = service ? journeys[service] : null;
  const stageIndex =
    journey?.stages.findIndex(item => item.id === params?.stage) ?? -1;
  const stage = stageIndex >= 0 ? journey?.stages[stageIndex] : undefined;
  const { data: referenceData } = useCustomerReferenceData();
  const { data: recipients = [] } = useCustomerRecipients();
  const { data: savedDrafts = [] } = useCustomerDrafts();
  const mutations = useShipmentDraftMutations();
  const restoredServerDraft = useRef(false);
  const [draft, setDraft] = useState<WizardDraft>(() => {
    if (!service || typeof window === "undefined")
      return freshDraft(user ?? undefined, service ?? undefined);
    try {
      return {
        ...freshDraft(user ?? undefined, service),
        ...JSON.parse(sessionStorage.getItem(storageKey(service)) || "{}"),
      };
    } catch {
      return freshDraft(user ?? undefined, service);
    }
  });
  const [submitted, setSubmitted] = useState<{
    id: string;
    reference: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const offices = referenceData?.pickupOfficeSuggestions ?? [];

  useEffect(() => {
    if (!service || !journey || !stage) navigate("/send");
  }, [journey, navigate, service, stage]);
  useEffect(() => {
    if (service)
      sessionStorage.setItem(storageKey(service), JSON.stringify(draft));
  }, [draft, service]);
  useEffect(() => {
    const draftId = new URLSearchParams(window.location.search).get("draft");
    if (!draftId || restoredServerDraft.current) return;
    const saved = savedDrafts.find(item => item.id === draftId);
    const payload = saved?.payload as { wizardDraft?: WizardDraft } | undefined;
    if (!payload?.wizardDraft) return;
    restoredServerDraft.current = true;
    setDraft({
      ...freshDraft(user ?? undefined, service ?? undefined),
      ...payload.wizardDraft,
    });
    feedback.success("Your saved booking is ready to continue.");
  }, [savedDrafts, user]);

  const update = <K extends keyof WizardDraft>(key: K, value: WizardDraft[K]) =>
    setDraft(current => ({ ...current, [key]: value, quote: undefined }));
  const activeStage = stage ?? journey?.stages[0];
  const selectService = (next: BookingService) =>
    navigate(bookingStartPath[next]);
  const goBack = () =>
    stageIndex > 0 && journey
      ? navigate(`/send/${service}/${journey.stages[stageIndex - 1].id}`)
      : navigate("/send");
  const routeReady =
    Boolean(draft.pickup.trim() && draft.destination.trim()) &&
    (service === "import" || service === "intercity"
      ? Boolean(
          draft.pickupBranchId &&
            draft.destinationBranchId &&
            draft.pickupBranchId !== draft.destinationBranchId
        )
      : true);
  const cargoReady = draft.cargoRows.some(
    row => row.name.trim() && Number(row.quantity) > 0
  );
  const contactsReady =
    service === "custom" || service === "import"
      ? Boolean(draft.receiver.name.trim() && draft.receiver.phone.trim())
      : Boolean(
          draft.sender.name.trim() &&
            draft.sender.phone.trim() &&
            draft.receiver.name.trim() &&
            draft.receiver.phone.trim()
        );
  const stageReady =
    activeStage?.id === "route"
      ? routeReady
      : activeStage?.id === "cargo"
        ? cargoReady
        : activeStage?.id === "contacts" || activeStage?.id === "receiver"
          ? contactsReady
          : activeStage?.id === "details"
            ? Boolean(draft.requestType.trim() && cargoReady && contactsReady)
            : true;

  const quoteRequest = useMemo(
    () =>
      service
        ? {
            service,
            bookingType: {
              local: "local_delivery",
              intercity: "city_to_city",
              import: "international_import",
              custom: "custom_request",
            }[service],
            pickup: {
              city: draft.pickup,
              area: draft.pickup,
              ...(Number.isFinite(draft.pickupLatitude) &&
              Number.isFinite(draft.pickupLongitude)
                ? {
                    latitude: draft.pickupLatitude,
                    longitude: draft.pickupLongitude,
                  }
                : {}),
              ...(draft.pickupBranchId
                ? { branchId: draft.pickupBranchId }
                : {}),
            },
            destination: {
              city: draft.destination,
              area: draft.destination,
              ...(Number.isFinite(draft.destinationLatitude) &&
              Number.isFinite(draft.destinationLongitude)
                ? {
                    latitude: draft.destinationLatitude,
                    longitude: draft.destinationLongitude,
                  }
                : {}),
              ...(draft.destinationBranchId
                ? { branchId: draft.destinationBranchId }
                : {}),
            },
            ...(service === "local" ? { vehicleType: "scooter" } : {}),
            ...(service === "import"
              ? {
                  transportMode: draft.transport,
                  onwardDelivery:
                    draft.fulfilment === "door_delivery"
                      ? "local"
                      : "collection",
                }
              : {}),
            ...(service === "intercity"
              ? { fulfilment: draft.fulfilment }
              : {}),
            schedule: draft.schedule,
            ...(draft.schedule === "scheduled" && draft.scheduledAt
              ? { scheduledAt: draft.scheduledAt }
              : {}),
            cargo: {
              items: draft.cargoRows
                .filter(row => row.name.trim())
                .map(row => ({
                  name: row.name.trim(),
                  quantity: Math.max(1, Number(row.quantity) || 1),
                })),
              fragile: false,
              packageType: "standard",
            },
          }
        : null,
    [draft, service]
  );

  const serverPayload = (quote: BookingQuote) => ({
    service,
    title: journey?.label,
    progressLabel: "Review complete",
    stage: "review",
    wizardDraft: draft,
    form: {
      pickup: draft.pickup,
      pickupLatitude: draft.pickupLatitude,
      pickupLongitude: draft.pickupLongitude,
      pickupBranchId: draft.pickupBranchId,
      destination: draft.destination,
      destinationLatitude: draft.destinationLatitude,
      destinationLongitude: draft.destinationLongitude,
      destinationBranchId: draft.destinationBranchId,
      recipient: draft.receiver.name,
      phone: draft.receiver.phone,
      sender: draft.sender.name,
      senderPhone: draft.sender.phone,
      transportMode: service === "import" ? draft.transport : null,
      fulfilment: draft.fulfilment,
      schedule: draft.schedule,
      instructions:
        service === "custom"
          ? `${draft.requestType}: ${draft.requestDetail}`
          : draft.instructions,
    },
    cargoRows: draft.cargoRows
      .filter(row => row.name.trim())
      .map(row => ({
        name: row.name.trim(),
        quantity: Math.max(1, Number(row.quantity) || 1),
      })),
    pricing: {
      request: quoteRequest,
      quotePayload: quote.quotePayload,
      quoteSignature: quote.quoteSignature,
      quoteSource: quote.source,
    },
  });

  const requestQuote = async () => {
    if (!quoteRequest) throw new Error("Booking route is incomplete");
    const quote = await apiRequest<BookingQuote>("/bookings/quote", {
      method: "POST",
      body: quoteRequest,
    });
    setDraft(current => ({ ...current, quote }));
    return quote;
  };

  const next = async () => {
    if (!service || !journey || !activeStage) return;
    if (!stageReady) {
      feedback.error("Complete the required details before continuing.");
      return;
    }
    const nextStage = journey.stages[stageIndex + 1];
    if (!nextStage) return;
    if (nextStage.id === "review") {
      setBusy(true);
      try {
        await requestQuote();
        navigate(`/send/${service}/review`);
      } catch {
        feedback.error(
          "We could not calculate this request. Check the route and try again."
        );
      } finally {
        setBusy(false);
      }
      return;
    }
    navigate(`/send/${service}/${nextStage.id}`);
  };

  const saveDraft = async () => {
    if (!service || !journey) return;
    try {
      await mutations.create.mutateAsync({
        payload: {
          service,
          title: journey.label,
          progressLabel: activeStage?.label,
          stage: activeStage?.id,
          wizardDraft: draft,
        },
      });
      feedback.success("Booking draft saved to your account.");
    } catch {
      feedback.error("We could not save this draft.");
    }
  };

  const submit = async () => {
    if (!service || !journey) return;
    setBusy(true);
    try {
      const quote = draft.quote ?? (await requestQuote());
      const saved = await mutations.create.mutateAsync({
        payload: serverPayload(quote),
      });
      const result = await mutations.submit.mutateAsync({
        id: saved.id,
        revision: saved.revision,
      });
      setSubmitted({ id: result.id, reference: result.trackingNumber });
      sessionStorage.removeItem(storageKey(service));
    } catch {
      feedback.error(
        "We could not submit this booking. Your details remain on this device."
      );
    } finally {
      setBusy(false);
    }
  };

  if (!service || !journey || !activeStage) return null;
  if (submitted)
    return (
      <Confirmation
        service={service}
        label={journey.label}
        reference={submitted.reference}
        onHome={() => navigate("/")}
        onOpen={() => navigate(`/shipments/${submitted.id}`)}
      />
    );

  const header = (
    <>
      <BookingServiceTabs selected={service} onSelect={selectService} />
      <header className="mt-7">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-bold text-cargo-yellow">{journey.label}</p>
          <p className="text-xs font-semibold text-ink/45">
            Step {stageIndex + 1} of {journey.stages.length}
          </p>
        </div>
        <h1 className="mt-2 font-heading text-3xl font-extrabold text-foreground sm:text-4xl">
          {activeStage.title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink/55">
          {activeStage.detail}
        </p>
        <div
          className="mt-5 flex gap-1.5"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={journey.stages.length}
          aria-valuenow={stageIndex + 1}
        >
          {journey.stages.map((item, index) => (
            <div key={item.id} className="min-w-0 flex-1">
              <div
                className={`h-1 rounded-full ${index <= stageIndex ? "bg-cargo-yellow" : "bg-ink/10"}`}
              />
              <span
                className={`mt-2 hidden text-[10px] font-semibold sm:block ${index === stageIndex ? "text-foreground" : "text-ink/35"}`}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </header>
    </>
  );

  const footerActions = (
    <div className="mt-8 flex flex-col-reverse gap-3 border-t border-ink/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-ink/10 px-4 py-3 text-sm font-bold text-foreground"
        >
          <ArrowLeft className="size-4" /> Back
        </button>
        {activeStage.id !== "review" && (
          <button
            type="button"
            onClick={saveDraft}
            disabled={mutations.create.isPending}
            className="rounded-xl border border-cargo-yellow/40 bg-cargo-yellow/10 px-4 py-3 text-sm font-bold text-foreground"
          >
            Save draft
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={activeStage.id === "review" ? submit : next}
        disabled={busy || mutations.submit.isPending}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-cargo-yellow px-6 text-sm font-bold text-ink disabled:opacity-50"
      >
        {busy
          ? "Please wait..."
          : activeStage.id === "review"
            ? service === "local"
              ? "Confirm delivery request"
              : "Request a quote"
            : `Continue to ${journey.stages[stageIndex + 1]?.label ?? "review"}`}
        <ArrowRight className="size-4" />
      </button>
    </div>
  );

  if (activeStage.id === "route") {
    return (
      <div className="pb-24 sm:pb-8">
        <button
          type="button"
          onClick={goBack}
          className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-ink/60"
        >
          <ArrowLeft className="size-4" /> Back
        </button>
        <div className="grid gap-7 xl:grid-cols-[minmax(390px,560px)_minmax(0,1fr)] xl:items-stretch">
          <div className="mx-auto w-full max-w-xl xl:mx-0">
            {header}
            <main className="mt-7 rounded-[28px] border border-ink/10 bg-white p-5 sm:p-8">
              <RouteStage
                service={service}
                draft={draft}
                offices={offices}
                update={update}
                mode="fields"
              />
              {footerActions}
            </main>
          </div>
          <RouteStage
            service={service}
            draft={draft}
            offices={offices}
            update={update}
            mode="map"
            mapClassName="min-h-[520px] xl:-mr-12 xl:min-h-[calc(100dvh-8rem)] xl:rounded-l-[28px] xl:rounded-r-none"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl pb-24 sm:pb-8">
      <button
        type="button"
        onClick={goBack}
        className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-ink/60"
      >
        <ArrowLeft className="size-4" /> Back
      </button>
      {header}

      <main className="mt-7 rounded-[28px] border border-ink/10 bg-white p-5 sm:p-8">
        {activeStage.id === "cargo" && (
          <CargoStage draft={draft} update={update} />
        )}
        {(activeStage.id === "contacts" || activeStage.id === "receiver") && (
          <ContactsStage
            service={service}
            draft={draft}
            recipients={recipients}
            update={update}
          />
        )}
        {activeStage.id === "fulfilment" && (
          <FulfilmentStage draft={draft} update={update} />
        )}
        {activeStage.id === "details" && (
          <CustomDetailsStage draft={draft} update={update} />
        )}
        {activeStage.id === "review" && (
          <ReviewStage
            service={service}
            draft={draft}
            journey={journey}
            update={update}
            onEdit={target => navigate(`/send/${service}/${target}`)}
          />
        )}
        {footerActions}
      </main>
    </div>
  );
}

type UpdateDraft = <K extends keyof WizardDraft>(
  key: K,
  value: WizardDraft[K]
) => void;
type Office = {
  id: string;
  name: string;
  address: string;
  detail: string;
  city?: string | null;
  country?: string | null;
  countryCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

function fallbackOfficeCoordinates(office: Office): RouteMapPoint {
  const searchable = [
    office.name,
    office.address,
    office.detail,
    office.city ?? "",
    office.country ?? "",
    office.countryCode ?? "",
  ]
    .join(" ")
    .toLowerCase();
  if (searchable.includes("guangzhou"))
    return { label: "", latitude: 23.1291, longitude: 113.2644 };
  if (searchable.includes("harare") || searchable.includes("zimbabwe"))
    return { label: "", latitude: -17.8292, longitude: 31.0522 };
  if (searchable.includes("kitwe"))
    return { label: "", latitude: -12.8024, longitude: 28.2132 };
  if (searchable.includes("ndola"))
    return { label: "", latitude: -12.9587, longitude: 28.6366 };
  if (searchable.includes("livingstone"))
    return { label: "", latitude: -17.8419, longitude: 25.8543 };
  if (searchable.includes("lusaka"))
    return { label: "", latitude: -15.3875, longitude: 28.3228 };
  return { label: "" };
}

function officeMapPoint(office: Office): RouteMapOffice {
  const fallback = fallbackOfficeCoordinates(office);
  return {
    id: office.id,
    name: office.name,
    address: office.address,
    label: `${office.name} - ${office.address}`,
    latitude:
      typeof office.latitude === "number" ? office.latitude : fallback.latitude,
    longitude:
      typeof office.longitude === "number"
        ? office.longitude
        : fallback.longitude,
  };
}

function RouteStage({
  service,
  draft,
  offices,
  update,
  mode = "combined",
  mapClassName,
}: {
  service: BookingService;
  draft: WizardDraft;
  offices: Office[];
  update: UpdateDraft;
  mode?: "fields" | "map" | "combined";
  mapClassName?: string;
}) {
  const mapOffices = offices.map(officeMapPoint);
  const pickupPoint: RouteMapPoint = {
    label: draft.pickup,
    latitude: draft.pickupLatitude,
    longitude: draft.pickupLongitude,
  };
  const destinationPoint: RouteMapPoint = {
    label: draft.destination,
    latitude: draft.destinationLatitude,
    longitude: draft.destinationLongitude,
  };
  const selectBranch = (target: "pickup" | "destination", office: Office) => {
    const mapped = officeMapPoint(office);
    if (target === "pickup") {
      update("pickupBranchId", office.id);
      update("pickup", mapped.label);
      update("pickupLatitude", mapped.latitude);
      update("pickupLongitude", mapped.longitude);
      return;
    }
    update("destinationBranchId", office.id);
    update("destination", mapped.label);
    update("destinationLatitude", mapped.latitude);
    update("destinationLongitude", mapped.longitude);
  };
  const selectMapPoint = (
    target: "pickup" | "destination",
    point: Required<RouteMapPoint>
  ) => {
    if (target === "pickup") {
      update("pickup", point.label);
      update("pickupLatitude", point.latitude);
      update("pickupLongitude", point.longitude);
      return;
    }
    update("destination", point.label);
    update("destinationLatitude", point.latitude);
    update("destinationLongitude", point.longitude);
  };
  const routeMap = (
    <BookingRouteMap
      pickup={pickupPoint}
      destination={destinationPoint}
      offices={mapOffices}
      international={service === "import"}
      allowMapSelection={service !== "intercity" && service !== "import"}
      className={mapClassName}
      onPointSelect={selectMapPoint}
    />
  );

  if (mode === "map") return routeMap;

  if (service === "intercity" || service === "import") {
    const fields = (
      <div className="space-y-5">
        <BranchField
          label={service === "import" ? "Origin office" : "Origin branch"}
          value={draft.pickupBranchId}
          offices={offices}
          onSelect={office => selectBranch("pickup", office)}
        />
        <BranchField
          label={
            service === "import"
              ? "Zambia receiving branch"
              : "Destination branch"
          }
          value={draft.destinationBranchId}
          offices={offices.filter(item => item.id !== draft.pickupBranchId)}
          onSelect={office => selectBranch("destination", office)}
        />
        {service === "import" && (
          <section>
            <p className="mb-3 text-xs font-bold text-ink/50">
              Shipping method
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <Choice
                selected={draft.transport === "air"}
                icon={Plane}
                title="Air Freight"
                detail="Faster for time-sensitive cargo."
                onClick={() => update("transport", "air")}
              />
              <Choice
                selected={draft.transport === "sea"}
                icon={Ship}
                title="Sea Freight"
                detail="Best for larger or flexible shipments."
                onClick={() => update("transport", "sea")}
              />
            </div>
          </section>
        )}
      </div>
    );
    if (mode === "fields") return fields;
    return (
      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
        {fields}
        {routeMap}
      </div>
    );
  }

  const fields = (
    <div className="space-y-5">
      <TextField
        label="Pickup location"
        icon={MapPin}
        value={draft.pickup}
        onChange={value => {
          update("pickup", value);
          update("pickupLatitude", undefined);
          update("pickupLongitude", undefined);
        }}
        placeholder="Street, area and city"
      />
      <TextField
        label="Delivery location"
        icon={MapPin}
        value={draft.destination}
        onChange={value => {
          update("destination", value);
          update("destinationLatitude", undefined);
          update("destinationLongitude", undefined);
        }}
        placeholder="Street, area and city"
      />
    </div>
  );
  if (mode === "fields") return fields;
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
      {fields}
      {routeMap}
    </div>
  );
}

function CargoStage({
  draft,
  update,
}: {
  draft: WizardDraft;
  update: UpdateDraft;
}) {
  const rows = draft.cargoRows;
  const change = (id: number, key: "name" | "quantity", value: string) =>
    update(
      "cargoRows",
      rows.map(row => (row.id === id ? { ...row, [key]: value } : row))
    );
  return (
    <div>
      <div className="space-y-3">
        {rows.map((row, index) => (
          <div
            key={row.id}
            className="grid grid-cols-[minmax(0,1fr)_88px_40px] gap-2"
          >
            <input
              aria-label={`Cargo item ${index + 1}`}
              value={row.name}
              onChange={event => change(row.id, "name", event.target.value)}
              placeholder="Item name"
              className="h-12 min-w-0 rounded-xl border border-ink/10 bg-[#f7f8fb] px-4 text-sm font-semibold outline-none focus:border-cargo-yellow"
            />
            <input
              aria-label={`Quantity for cargo item ${index + 1}`}
              type="number"
              min="1"
              value={row.quantity}
              onChange={event => change(row.id, "quantity", event.target.value)}
              className="h-12 min-w-0 rounded-xl border border-ink/10 bg-[#f7f8fb] px-2 text-center text-sm font-semibold outline-none"
            />
            <button
              type="button"
              aria-label={`Remove cargo item ${index + 1}`}
              disabled={rows.length === 1}
              onClick={() =>
                update(
                  "cargoRows",
                  rows.filter(item => item.id !== row.id)
                )
              }
              className="grid size-10 place-items-center self-center rounded-xl border border-ink/10 text-ink/45 disabled:opacity-30"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() =>
          update("cargoRows", [
            ...rows,
            { id: Date.now(), name: "", quantity: "1" },
          ])
        }
        className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-cargo-yellow"
      >
        <Plus className="size-4" /> Add another item
      </button>
      <label className="mt-6 block">
        <span className="mb-2 block text-xs font-bold text-ink/50">
          Additional description (optional)
        </span>
        <textarea
          value={draft.cargoDescription}
          onChange={event => update("cargoDescription", event.target.value)}
          rows={4}
          className="w-full resize-none rounded-xl border border-ink/10 bg-[#f7f8fb] p-4 text-sm outline-none focus:border-cargo-yellow"
        />
      </label>
    </div>
  );
}

function ContactsStage({
  service,
  draft,
  recipients,
  update,
}: {
  service: BookingService;
  draft: WizardDraft;
  recipients: Array<{
    id: string;
    name: string;
    phone: string;
    location: string;
  }>;
  update: UpdateDraft;
}) {
  return (
    <div className="space-y-7">
      {service !== "import" && (
        <ContactSection
          title="Sender"
          contact={draft.sender}
          onChange={value => update("sender", value)}
        />
      )}
      {recipients.length > 0 && (
        <label className="block">
          <span className="mb-2 block text-xs font-bold text-ink/50">
            Saved recipient
          </span>
          <select
            defaultValue=""
            onChange={event => {
              const saved = recipients.find(
                item => item.id === event.target.value
              );
              if (saved)
                update("receiver", { name: saved.name, phone: saved.phone });
            }}
            className="h-12 w-full rounded-xl border border-ink/10 bg-[#f7f8fb] px-4 text-sm font-semibold"
          >
            <option value="">Choose saved recipient</option>
            {recipients.map(item => (
              <option key={item.id} value={item.id}>
                {item.name} - {item.location}
              </option>
            ))}
          </select>
        </label>
      )}
      <ContactSection
        title={service === "import" ? "Receiver" : "Receiver"}
        contact={draft.receiver}
        onChange={value => update("receiver", value)}
      />
      {service === "import" && (
        <details className="rounded-xl border border-ink/10 p-4">
          <summary className="cursor-pointer text-sm font-bold">
            Supplier / Sender Abroad (optional)
          </summary>
          <div className="mt-4">
            <ContactSection
              title="Supplier contact"
              contact={draft.supplier}
              onChange={value => update("supplier", value)}
            />
          </div>
        </details>
      )}
      <TextField
        label="Instructions (optional)"
        icon={FileText}
        value={draft.instructions}
        onChange={value => update("instructions", value)}
        placeholder="Landmark, entrance or call-on-arrival note"
      />
    </div>
  );
}

function FulfilmentStage({
  draft,
  update,
}: {
  draft: WizardDraft;
  update: UpdateDraft;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Choice
        selected={draft.fulfilment === "collection"}
        icon={Building2}
        title="Collection point"
        detail="Sender or receiver uses a New World Cargo branch."
        onClick={() => update("fulfilment", "collection")}
      />
      <Choice
        selected={draft.fulfilment === "door_delivery"}
        icon={Truck}
        title="Door delivery"
        detail="Arrange collection or delivery to the supplied address."
        onClick={() => update("fulfilment", "door_delivery")}
      />
    </div>
  );
}

function CustomDetailsStage({
  draft,
  update,
}: {
  draft: WizardDraft;
  update: UpdateDraft;
}) {
  return (
    <div className="space-y-7">
      <section>
        <p className="mb-3 text-xs font-bold text-ink/50">Request type</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Choice
            selected={draft.requestType === "Special cargo"}
            icon={Package}
            title="Special cargo"
            detail="An item needing a tailored plan."
            onClick={() => update("requestType", "Special cargo")}
          />
          <Choice
            selected={draft.requestType === "Business movement"}
            icon={Building2}
            title="Business movement"
            detail="A recurring or commercial route."
            onClick={() => update("requestType", "Business movement")}
          />
          <Choice
            selected={draft.requestType === "Other request"}
            icon={SlidersHorizontal}
            title="Other request"
            detail="Something outside the usual services."
            onClick={() => update("requestType", "Other request")}
          />
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-sm font-bold text-foreground">Cargo</h2>
        <CargoStage draft={draft} update={update} />
      </section>
      <label className="block">
        <span className="mb-2 block text-xs font-bold text-ink/50">
          Describe your request (optional)
        </span>
        <textarea
          value={draft.requestDetail}
          onChange={event => update("requestDetail", event.target.value)}
          rows={4}
          className="w-full resize-none rounded-xl border border-ink/10 bg-[#f7f8fb] p-4 text-sm outline-none focus:border-cargo-yellow"
        />
      </label>
      <ContactSection
        title="Contact person"
        contact={draft.receiver}
        onChange={value => update("receiver", value)}
      />
    </div>
  );
}

function ReviewStage({
  service,
  draft,
  journey,
  update,
  onEdit,
}: {
  service: BookingService;
  draft: WizardDraft;
  journey: { label: string; stages: Stage[] };
  update: UpdateDraft;
  onEdit: (stage: string) => void;
}) {
  const rows = [
    ["Service", journey.label],
    ["Route", `${draft.pickup} to ${draft.destination}`],
    ...(service === "custom" ? [["Request", draft.requestType]] : []),
    [
      "Cargo",
      draft.cargoRows.map(item => `${item.name} x ${item.quantity}`).join(", "),
    ],
    ["Receiver", `${draft.receiver.name} - ${draft.receiver.phone}`],
    ...(service === "import"
      ? [["Method", draft.transport === "air" ? "Air Freight" : "Sea Freight"]]
      : []),
    ...(service === "intercity"
      ? [
          [
            "Collection",
            draft.fulfilment === "door_delivery"
              ? "Door delivery"
              : "Collection point",
          ],
        ]
      : []),
  ];
  return (
    <div className="space-y-5">
      {service === "local" && (
        <section>
          <p className="mb-3 text-xs font-bold text-ink/50">Pickup time</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Choice
              selected={draft.schedule === "as_soon_as_possible"}
              icon={Truck}
              title="As soon as possible"
              detail="Use the next available pickup."
              onClick={() => update("schedule", "as_soon_as_possible")}
            />
            <Choice
              selected={draft.schedule === "scheduled"}
              icon={CalendarDays}
              title="Schedule pickup"
              detail="Choose a preferred date and time."
              onClick={() => update("schedule", "scheduled")}
            />
          </div>
          {draft.schedule === "scheduled" && (
            <input
              type="datetime-local"
              value={draft.scheduledAt}
              onChange={event => update("scheduledAt", event.target.value)}
              className="mt-3 h-12 w-full rounded-xl border border-ink/10 bg-[#f7f8fb] px-4 text-sm font-semibold"
            />
          )}
        </section>
      )}
      <div className="divide-y divide-ink/10 rounded-xl border border-ink/10">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-start justify-between gap-4 p-4 text-sm"
          >
            <span className="text-ink/50">{label}</span>
            <span className="max-w-[68%] text-right font-semibold text-foreground">
              {value || "Not provided"}
            </span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {journey.stages
          .filter(item => item.id !== "review")
          .map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => onEdit(item.id)}
              className="rounded-xl border border-ink/10 px-3 py-2 text-xs font-bold text-foreground"
            >
              Edit {item.label}
            </button>
          ))}
      </div>
      <div className="rounded-xl border border-cargo-yellow/35 bg-cargo-yellow/10 p-4">
        <p className="text-sm font-bold text-foreground">
          {draft.quote?.formattedTotal || "Quote pending"}
        </p>
        <p className="mt-1 text-xs text-ink/55">
          This server-calculated amount is checked again when you submit.
          Operations confirms manually priced requests.
        </p>
      </div>
    </div>
  );
}

function ContactSection({
  title,
  contact,
  onChange,
}: {
  title: string;
  contact: Contact;
  onChange: (contact: Contact) => void;
}) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-bold text-foreground">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Name"
          icon={UserRound}
          value={contact.name}
          onChange={name => onChange({ ...contact, name })}
          placeholder="Full name"
        />
        <TextField
          label="Phone"
          icon={Phone}
          value={contact.phone}
          onChange={phone => onChange({ ...contact, phone })}
          placeholder="+260 ..."
        />
      </div>
    </section>
  );
}
function TextField({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  icon: typeof MapPin;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-ink/50">{label}</span>
      <div className="flex items-center gap-3 rounded-xl border border-ink/10 bg-[#f7f8fb] px-4">
        <Icon className="size-4 shrink-0 text-ink/40" />
        <input
          value={value}
          onChange={event => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-12 min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
        />
      </div>
    </label>
  );
}
function BranchField({
  label,
  value,
  offices,
  onSelect,
}: {
  label: string;
  value: string;
  offices: Office[];
  onSelect: (office: Office) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-ink/50">{label}</span>
      <div className="flex items-center gap-3 rounded-xl border border-ink/10 bg-[#f7f8fb] px-4">
        <Building2 className="size-4 text-ink/40" />
        <select
          value={value}
          onChange={event => {
            const office = offices.find(item => item.id === event.target.value);
            if (office) onSelect(office);
          }}
          className="h-12 min-w-0 flex-1 bg-transparent text-sm font-semibold"
        >
          <option value="">Choose a branch</option>
          {offices.map(item => (
            <option key={item.id} value={item.id}>
              {item.name} - {item.address}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}
function Choice({
  selected,
  icon: Icon,
  title,
  detail,
  onClick,
}: {
  selected: boolean;
  icon: typeof Plane;
  title: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-24 items-start gap-3 rounded-xl border p-4 text-left ${selected ? "border-cargo-yellow bg-cargo-yellow/10" : "border-ink/10 bg-[#f7f8fb]"}`}
    >
      <span
        className={`grid size-10 shrink-0 place-items-center rounded-xl ${selected ? "bg-cargo-yellow text-ink" : "bg-white text-ink/50"}`}
      >
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2 text-sm font-bold text-foreground">
          {title}
          {selected && <Check className="size-4" />}
        </span>
        <span className="mt-1 block text-xs text-ink/50">{detail}</span>
      </span>
    </button>
  );
}
function Confirmation({
  label,
  reference,
  onHome,
  onOpen,
}: {
  service: BookingService;
  label: string;
  reference: string;
  onHome: () => void;
  onOpen: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[65vh] max-w-xl items-center">
      <div className="w-full rounded-[28px] border border-ink/10 bg-white p-7 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-cargo-yellow">
          <Check className="size-8" />
        </span>
        <p className="mt-5 text-xs font-bold text-cargo-yellow">{label}</p>
        <h1 className="mt-2 font-heading text-3xl font-extrabold text-foreground">
          Request received
        </h1>
        <p className="mt-2 text-sm text-ink/55">
          Booking reference {reference}. Operations will review it before
          creating the shipment.
        </p>
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <button
            onClick={onOpen}
            className="rounded-xl bg-cargo-yellow py-3 text-sm font-bold text-ink"
          >
            Open request
          </button>
          <button
            onClick={onHome}
            className="rounded-xl border border-ink/10 py-3 text-sm font-bold text-foreground"
          >
            Back home
          </button>
        </div>
      </div>
    </div>
  );
}
