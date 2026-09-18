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
import { type BookingService } from "@/components/booking-service-grid";
import {
  BookingRouteMap,
  type RouteMapOffice,
  type RouteMapPoint,
} from "@/components/booking-route-map";
import { feedback } from "@/lib/feedback";

type CargoRow = { id: number; name: string; quantity: string };
type Contact = { name: string; phone: string };
type LocalDeliveryVehicle = "scooter" | "small_van" | "cargo_van";
type RouteTarget = "pickup" | "destination";
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
  supplierCompany: string;
  supplierEmail: string;
  supplierNotes: string;
  instructions: string;
  fulfilment: "collection" | "door_delivery";
  schedule: "as_soon_as_possible" | "scheduled";
  scheduledAt: string;
  requestType: string;
  requestDetail: string;
  vehicle: LocalDeliveryVehicle;
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
        label: "Route",
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
        title: "Where should we move it?",
        detail:
          "Search pickup and destination first. The map reacts while you edit the booking details.",
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
    supplierCompany: "",
    supplierEmail: "",
    supplierNotes: "",
    instructions: "",
    fulfilment: "collection",
    schedule: "as_soon_as_possible",
    scheduledAt: "",
    requestType: "",
    requestDetail: "",
    vehicle: "scooter",
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
  const [activeRouteTarget, setActiveRouteTarget] =
    useState<RouteTarget>("pickup");
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
  const goBack = () =>
    stageIndex > 0 && journey
      ? navigate(`/send/${service}/${journey.stages[stageIndex - 1].id}`)
      : navigate("/send");
  const routeReady =
    Boolean(draft.pickup.trim() && draft.destination.trim()) &&
    (service === "import"
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
            ...(service === "local" ? { vehicleType: draft.vehicle } : {}),
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
      vehicleType: service === "local" ? draft.vehicle : null,
      fulfilment: draft.fulfilment,
      schedule: draft.schedule,
      instructions:
        service === "custom"
          ? `${draft.requestType}: ${draft.requestDetail}`
          : draft.instructions,
      supplierName: service === "import" ? draft.supplier.name : null,
      supplierPhone: service === "import" ? draft.supplier.phone : null,
      supplierCompany: service === "import" ? draft.supplierCompany : null,
      supplierEmail: service === "import" ? draft.supplierEmail : null,
      supplierNotes: service === "import" ? draft.supplierNotes : null,
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
    <header>
      <h1 className="font-heading text-3xl font-extrabold text-foreground sm:text-4xl">
        {activeStage.title}
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-ink/55">{activeStage.detail}</p>
    </header>
  );

  const footerActions = (showBack = true, showSaveDraft = true) => (
    <div className="mt-8 flex flex-col-reverse gap-3 border-t border-ink/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
      {(showBack || (showSaveDraft && activeStage.id !== "review")) && (
        <div className="flex gap-2">
          {showBack && (
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-ink/10 px-4 py-3 text-sm font-bold text-foreground"
            >
              <ArrowLeft className="size-4" /> Back
            </button>
          )}
          {showSaveDraft && activeStage.id !== "review" && (
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
      )}
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

  const stageContent = (
    <>
      {activeStage.id === "route" && (
        <RouteStage
          service={service}
          draft={draft}
          offices={offices}
          update={update}
          activeRouteTarget={activeRouteTarget}
          onActiveRouteTargetChange={setActiveRouteTarget}
          mode="fields"
        />
      )}
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
    </>
  );

  return (
    <>
      <div className="-mx-4 -my-6 min-h-[calc(100dvh-4.5rem)] overflow-hidden bg-[#e7eef0] sm:-mx-8 sm:-my-8 xl:hidden">
        <div className="relative min-h-[calc(100dvh-4.5rem)]">
          <div className="absolute inset-0">
            <RouteStage
              service={service}
              draft={draft}
              offices={offices}
              update={update}
              activeRouteTarget={activeRouteTarget}
              onActiveRouteTargetChange={setActiveRouteTarget}
              mode="map"
              mapClassName="h-full min-h-full rounded-none border-0"
            />
          </div>
          <div className="absolute inset-x-4 top-4 z-20 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goBack}
              aria-label="Go back"
              className="grid size-11 place-items-center rounded-2xl border border-ink/10 bg-white text-ink shadow-lg"
            >
              <ArrowLeft className="size-4" />
            </button>
            <span className="size-11" aria-hidden="true" />
          </div>
          <section className="absolute inset-x-0 bottom-0 z-20 max-h-[72dvh] overflow-hidden rounded-t-[30px] border border-ink/10 bg-background shadow-[0_-18px_45px_rgba(1,38,66,0.18)]">
            <div className="flex min-h-8 items-center justify-center">
              <span className="h-1.5 w-12 rounded-full bg-ink/20" />
            </div>
            <div className="max-h-[calc(72dvh-2rem)] overflow-y-auto px-5 pb-5">
              {header}
              <main className="mt-5 rounded-[24px] border border-ink/10 bg-white p-5">
                {stageContent}
                {footerActions(false, false)}
              </main>
            </div>
          </section>
        </div>
      </div>

      <div className="-mx-4 -my-6 hidden min-h-[calc(100dvh-4.5rem)] bg-background sm:-mx-8 sm:-my-8 lg:-mx-12 lg:-my-10 xl:grid xl:min-h-[calc(100dvh-4.5rem)] xl:grid-cols-2">
        <section className="min-h-[calc(100dvh-4.5rem)] overflow-y-auto border-r border-ink/10 bg-background px-10 py-10 2xl:px-14">
          <div className="mx-auto max-w-xl">
            {header}
            <main className="mt-7 rounded-[28px] border border-ink/10 bg-white p-6 sm:p-8">
              {stageContent}
              {footerActions(false, false)}
            </main>
          </div>
        </section>
        <section className="relative min-h-[calc(100dvh-4.5rem)]">
          <button
            type="button"
            onClick={goBack}
            aria-label="Go back"
            className="absolute left-4 top-4 z-30 grid size-11 place-items-center rounded-2xl border border-ink/10 bg-white text-ink shadow-lg"
          >
            <ArrowLeft className="size-4" />
          </button>
          <RouteStage
            service={service}
            draft={draft}
            offices={offices}
            update={update}
            activeRouteTarget={activeRouteTarget}
            onActiveRouteTargetChange={setActiveRouteTarget}
            mode="map"
            mapClassName="h-full min-h-full rounded-none border-0"
          />
        </section>
      </div>
    </>
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
  activeRouteTarget,
  onActiveRouteTargetChange,
  mode = "combined",
  mapClassName,
}: {
  service: BookingService;
  draft: WizardDraft;
  offices: Office[];
  update: UpdateDraft;
  activeRouteTarget: RouteTarget;
  onActiveRouteTargetChange: (target: RouteTarget) => void;
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
      allowMapSelection={service !== "import"}
      centerPinSelection={service === "intercity"}
      activeTarget={activeRouteTarget}
      onActiveTargetChange={onActiveRouteTargetChange}
      className={mapClassName}
      onPointSelect={selectMapPoint}
    />
  );

  if (mode === "map") return routeMap;

  if (service === "intercity") {
    const fields = (
      <div className="space-y-5">
        <LocationSearchField
          label="From location"
          target="pickup"
          active={activeRouteTarget === "pickup"}
          value={draft.pickup}
          offices={offices}
          onFocusTarget={onActiveRouteTargetChange}
          onClear={() => {
            update("pickup", "");
            update("pickupLatitude", undefined);
            update("pickupLongitude", undefined);
            update("pickupBranchId", "");
            onActiveRouteTargetChange("pickup");
          }}
          onSelect={office => {
            selectBranch("pickup", office);
            onActiveRouteTargetChange("pickup");
          }}
        />
        <LocationSearchField
          label="To location"
          target="destination"
          active={activeRouteTarget === "destination"}
          value={draft.destination}
          offices={offices.filter(item => item.id !== draft.pickupBranchId)}
          onFocusTarget={onActiveRouteTargetChange}
          onClear={() => {
            update("destination", "");
            update("destinationLatitude", undefined);
            update("destinationLongitude", undefined);
            update("destinationBranchId", "");
            onActiveRouteTargetChange("destination");
          }}
          onSelect={office => {
            selectBranch("destination", office);
            onActiveRouteTargetChange("destination");
          }}
        />
        <div className="rounded-xl border border-ink/10 bg-[#f7f8fb] p-4">
          <p className="text-sm font-bold text-foreground">
            Confirm each point on the map
          </p>
          <p className="mt-1 text-xs leading-5 text-ink/55">
            Search a place, move or zoom the map under the fixed pin, then
            confirm From and To before continuing.
          </p>
        </div>
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

  if (service === "import") {
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
      {service === "local" && (
        <section>
          <p className="mb-3 text-xs font-bold text-ink/50">Vehicle size</p>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <Choice
              selected={draft.vehicle === "scooter"}
              icon={Truck}
              title="Bike"
              detail="Up to 8 kg for quick city delivery."
              onClick={() => update("vehicle", "scooter")}
            />
            <Choice
              selected={draft.vehicle === "small_van"}
              icon={Truck}
              title="Small van"
              detail="Up to 50 kg for boxes or bulky parcels."
              onClick={() => update("vehicle", "small_van")}
            />
            <Choice
              selected={draft.vehicle === "cargo_van"}
              icon={Truck}
              title="Cargo van"
              detail="Up to 300 kg for larger local moves."
              onClick={() => update("vehicle", "cargo_van")}
            />
          </div>
        </section>
      )}
      {service === "custom" && (
        <section className="rounded-xl border border-ink/10 bg-[#f7f8fb] p-4">
          <p className="text-sm font-bold text-foreground">
            Custom route details
          </p>
          <p className="mt-1 text-xs leading-5 text-ink/55">
            Use the map or type the pickup and destination first. The request
            type and cargo questions come next so operations can price it
            correctly.
          </p>
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
        <section>
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-xs font-bold text-ink/50">Saved recipients</p>
            <span className="text-[11px] font-semibold text-ink/35">
              Optional
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {recipients.slice(0, 4).map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  update("receiver", { name: item.name, phone: item.phone })
                }
                className="rounded-xl bg-cargo-yellow/15 px-3 py-2 text-xs font-bold text-ink transition hover:bg-cargo-yellow/25"
              >
                {item.name}
              </button>
            ))}
          </div>
        </section>
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
          <div className="mt-4 space-y-4">
            <ContactSection
              title="Supplier contact"
              contact={draft.supplier}
              onChange={value => update("supplier", value)}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Company or business"
                icon={Building2}
                value={draft.supplierCompany}
                onChange={value => update("supplierCompany", value)}
                placeholder="Company name"
              />
              <TextField
                label="Supplier email"
                icon={FileText}
                value={draft.supplierEmail}
                onChange={value => update("supplierEmail", value)}
                placeholder="supplier@example.com"
              />
            </div>
            <label className="block">
              <span className="mb-2 block text-xs font-bold text-ink/50">
                Other contact details
              </span>
              <textarea
                value={draft.supplierNotes}
                onChange={event => update("supplierNotes", event.target.value)}
                rows={3}
                placeholder="Address or additional contact information"
                className="w-full resize-none rounded-xl border border-ink/10 bg-[#f7f8fb] p-4 text-sm outline-none focus:border-cargo-yellow"
              />
            </label>
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

const localVehicleLabels: Record<LocalDeliveryVehicle, string> = {
  scooter: "Bike",
  small_van: "Small van",
  cargo_van: "Cargo van",
};

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
    ...(service === "local"
      ? [["Vehicle", localVehicleLabels[draft.vehicle]]]
      : []),
    [
      "Cargo",
      draft.cargoRows.map(item => `${item.name} x ${item.quantity}`).join(", "),
    ],
    ["Receiver", `${draft.receiver.name} - ${draft.receiver.phone}`],
    ...(service === "import" && draft.supplier.name
      ? [["Supplier", `${draft.supplier.name} - ${draft.supplier.phone}`]]
      : []),
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

function LocationSearchField({
  label,
  target,
  active,
  value,
  offices,
  onFocusTarget,
  onSelect,
  onClear,
}: {
  label: string;
  target: RouteTarget;
  active: boolean;
  value: string;
  offices: Office[];
  onFocusTarget: (target: RouteTarget) => void;
  onSelect: (office: Office) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  useEffect(() => setQuery(value), [value]);
  const suggestions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const matches = normalized
      ? offices.filter(office =>
          [office.name, office.address, office.city]
            .filter(Boolean)
            .some(item => item!.toLowerCase().includes(normalized))
        )
      : offices;
    return matches.slice(0, 6);
  }, [offices, query]);
  const choose = (office: Office) => {
    onSelect(office);
    setQuery(`${office.name} - ${office.address}`);
    setOpen(false);
    setHighlight(0);
  };
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-bold text-ink/50">{label}</span>
        {active && (
          <span className="rounded-full bg-cargo-yellow/20 px-2 py-1 text-[10px] font-extrabold text-ink">
            Active on map
          </span>
        )}
      </div>
      <div
        className={`rounded-xl border bg-[#f7f8fb] px-4 ${active ? "border-cargo-yellow shadow-[0_0_0_3px_rgba(255,200,61,0.18)]" : "border-ink/10"}`}
      >
        <div className="flex items-center gap-3">
          <MapPin className="size-4 shrink-0 text-ink/40" />
          <input
            value={query}
            onFocus={() => {
              onFocusTarget(target);
              setOpen(true);
            }}
            onChange={event => {
              setQuery(event.target.value);
              setOpen(true);
              setHighlight(0);
              onFocusTarget(target);
            }}
            onKeyDown={event => {
              if (!open && (event.key === "ArrowDown" || event.key === "Enter")) {
                setOpen(true);
                return;
              }
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setHighlight(index =>
                  Math.min(index + 1, Math.max(0, suggestions.length - 1))
                );
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setHighlight(index => Math.max(index - 1, 0));
              }
              if (event.key === "Enter" && suggestions[highlight]) {
                event.preventDefault();
                choose(suggestions[highlight]);
              }
              if (event.key === "Escape") setOpen(false);
            }}
            placeholder={
              target === "pickup"
                ? "Search where it is coming from"
                : "Search where it is going"
            }
            aria-label={label}
            aria-expanded={open}
            className="h-12 min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
          />
          {value && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                onClear();
                setOpen(true);
              }}
              className="rounded-lg px-2 py-1 text-xs font-bold text-ink/45 hover:bg-white hover:text-ink"
            >
              Clear
            </button>
          )}
        </div>
      </div>
      {open && (
        <div className="mt-2 overflow-hidden rounded-xl border border-ink/10 bg-white shadow-lg">
          {suggestions.length ? (
            suggestions.map((office, index) => (
              <button
                key={office.id}
                type="button"
                onMouseEnter={() => setHighlight(index)}
                onMouseDown={event => event.preventDefault()}
                onClick={() => choose(office)}
                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition ${index === highlight ? "bg-cargo-yellow/15" : "hover:bg-ink/[0.03]"}`}
              >
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-[#f7f8fb] text-ink/55">
                  {value.includes(office.id) ? (
                    <Check className="size-3.5" />
                  ) : (
                    <MapPin className="size-3.5" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-foreground">
                    {office.name}
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-ink/55">
                    {office.address}
                  </span>
                </span>
              </button>
            ))
          ) : (
            <div className="px-4 py-5 text-sm font-semibold text-ink/55">
              No matching place found. Try a city, area, road, or office name.
            </div>
          )}
        </div>
      )}
    </div>
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
