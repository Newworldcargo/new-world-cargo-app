/**
 * Design reminder: New World Cargo uses a minimalist, white Poppins interface.
 * Keep the cargo journey practical, use Cargo Yellow only for active choices,
 * and express hierarchy through spacing, weight, and subtle surfaces—not shadows.
 */
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  FileText,
  Home,
  ImagePlus,
  MapPin,
  Package,
  Phone,
  Plus,
  Plane,
  ShipWheel,
  Upload,
  UserRound,
  Warehouse,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { PaymentModal } from "@/components/payment-modal";
import { SubpageBackButton } from "@/components/subpage-back-button";
import { useCustomerRecipients, useCustomerReferenceData } from "@/api/hooks";
import { useCustomerWorkflowStore } from "@/stores/customer-workflow-store";

const steps = ["Pickup", "Recipient", "Cargo", "Transport", "Review"];

type EvidenceState = {
  photos: string[];
  documents: string[];
};

type CargoRow = {
  id: number;
  name: string;
  quantity: string;
};

export default function SendShipment() {
  const [location, navigate] = useLocation();
  const { data: referenceData, isLoading: isReferenceDataLoading } = useCustomerReferenceData();
  const { data: savedRecipients = [] } = useCustomerRecipients();
  const shipmentDrafts = useCustomerWorkflowStore((state) => state.shipmentDrafts);
  const latestQuote = useCustomerWorkflowStore((state) => state.latestQuote);
  const saveShipmentDraft = useCustomerWorkflowStore((state) => state.saveShipmentDraft);
  const setLatestQuote = useCustomerWorkflowStore((state) => state.setLatestQuote);
  const [step, setStep] = useState(0);
  const [success, setSuccess] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [transport, setTransport] = useState<"air" | "sea">("air");
  const [handover, setHandover] = useState<"collect" | "delivery">("collect");
  const [evidence, setEvidence] = useState<EvidenceState>({ photos: [], documents: [] });
  const [cargoRows, setCargoRows] = useState<CargoRow[]>([
    { id: 1, name: "", quantity: "1" },
    { id: 2, name: "", quantity: "1" },
  ]);
  const [nextCargoId, setNextCargoId] = useState(3);
  const [form, setForm] = useState({
    pickup: "",
    recipient: "Amina Banda",
    phone: "+260 977 123 456",
    recipientNotes: "",
    destination: "",
    contents: "",
    packages: "",
  });
  useEffect(() => {
    if (location.includes("draft=latest")) {
      const saved = Object.values(shipmentDrafts).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
      if (!saved) return;
      const payload = saved.payload as Partial<{ form: typeof form; cargoRows: CargoRow[]; transport: "air" | "sea"; handover: "collect" | "delivery"; evidence: EvidenceState }>;
      if (payload.form) setForm(payload.form);
      if (payload.cargoRows) setCargoRows(payload.cargoRows);
      if (payload.transport) setTransport(payload.transport);
      if (payload.handover) setHandover(payload.handover);
      if (payload.evidence) setEvidence(payload.evidence);
      setStep(saved.step);
      toast("Your saved draft is ready to continue.");
    }
    if (location.includes("quote=latest")) {
      if (!latestQuote) return;
      if (Date.now() > new Date(latestQuote.expiresAt).getTime()) { setLatestQuote(null); toast("This quote has expired. Please request a fresh estimate."); return; }
      setForm((current) => ({ ...current, pickup: latestQuote.from || current.pickup, destination: latestQuote.to || current.destination, packages: String(latestQuote.weightKg || current.packages) }));
      toast(`Your ${latestQuote.serviceName} quote has been added. You can edit all details.`);
    }
  }, [latestQuote, location, setLatestQuote, shipmentDrafts]);

  const update = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const updateCargoRow = (id: number, key: "name" | "quantity", value: string) =>
    setCargoRows((current) => current.map((row) => (row.id === id ? { ...row, [key]: value } : row)));

  const addCargoRow = () => {
    setCargoRows((current) => [...current, { id: nextCargoId, name: "", quantity: "1" }]);
    setNextCargoId((current) => current + 1);
  };

  const removeCargoRow = (id: number) => {
    setCargoRows((current) => current.length > 1 ? current.filter((row) => row.id !== id) : current);
  };

  const addEvidence = (type: keyof EvidenceState, files: FileList | null) => {
    if (!files?.length) return;
    const names = Array.from(files).map((file) => file.name);
    setEvidence((current) => ({ ...current, [type]: [...current[type], ...names] }));
    toast(`${names.length} ${type === "photos" ? "photo" : "document"}${names.length > 1 ? "s" : ""} added.`);
  };

  const removeEvidence = (type: keyof EvidenceState, name: string) =>
    setEvidence((current) => ({ ...current, [type]: current[type].filter((item) => item !== name) }));

  const goBack = () => (step ? setStep((current) => current - 1) : navigate("/"));
  const next = () => (step < steps.length - 1 ? setStep((current) => current + 1) : setPaymentOpen(true));
  const saveDraft = () => {
    saveShipmentDraft({ id: "latest", step, payload: { form, cargoRows, transport, handover, evidence }, updatedAt: new Date().toISOString() });
    toast("Your cargo request draft has been saved.");
  };
  const useCurrentLocation = () => {
    if (!navigator.geolocation) { toast.error("Location services are not available in this browser."); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { update("pickup", `Current location · ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`); toast.success("Your current pickup location was added."); },
      () => toast.error("We could not access your location. Choose an office or enter an address instead."),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  };
  const saveRecipient = () => {
    if (!form.recipient.trim() || !form.phone.trim()) { toast.error("Add a cargo owner and phone number before saving this contact."); return; }
    toast.info("This contact is ready to be saved through the customer API when it is enabled.");
  };
  const transportOptions = referenceData?.cargoTransportOptions ?? [];
  const pickupOffices = referenceData?.pickupOfficeSuggestions ?? [];
  const selectedTransport = transportOptions.find((option) => option.id === transport) ?? { id: transport, name: transport === "air" ? "Air cargo" : "Sea cargo", detail: "Loading service options", eta: "To be confirmed" };

  if (success) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
        <div className="w-full rounded-[32px] border border-white/8 bg-white/[0.035] p-7 text-center sm:p-10">
          <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-cargo-yellow text-ink">
            <Check className="size-8" strokeWidth={2.5} />
          </div>
          <p className="mt-6 text-xs font-bold text-ink">Cargo request created</p>
          <h1 className="mt-3 font-heading text-3xl font-extrabold tracking-tight">We’re ready for it.</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm text-white/48">
            We’ll register your cargo when it reaches the selected New World Cargo office and notify you at every stage.
          </p>
          <div className="mt-7 rounded-2xl bg-cargo-yellow p-5 text-left text-ink">
            <p className="text-[10px] font-bold text-ink/50">Cargo reference</p>
            <div className="mt-2 flex items-center justify-between">
              <p className="font-heading text-2xl font-extrabold tracking-tight">NWC90418ZM</p>
              <Package className="size-6 opacity-50" />
            </div>
            <div className="mt-4 flex justify-between border-t border-ink/15 pt-3 text-xs font-semibold">
              <span>{selectedTransport.name}</span>
              <span>{handover === "collect" ? "Office collection" : "Home delivery"}</span>
            </div>
          </div>
          <p className="mt-4 text-xs text-white/45">Your final charge is shared when the cargo reaches its final service stage.</p>
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <button onClick={() => navigate("/shipments/shipment-48291")} className="rounded-2xl bg-white py-3 text-sm font-bold text-ink">
              Track cargo
            </button>
            <button onClick={() => navigate("/")} className="rounded-2xl border border-white/10 py-3 text-sm font-bold text-white/70">
              Back home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <SubpageBackButton
        className="mb-6"
        onClick={goBack}
        label={step ? "Previous step" : "Back home"}
      />

      <div className="mb-8">
        <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">Send a package</h1>
      </div>

      <div className="mb-8 flex gap-1.5">
        {steps.map((item, index) => (
          <div key={item} className="flex-1">
            <div className={`h-1 rounded-full ${index <= step ? "bg-cargo-yellow" : "bg-white/10"}`} />
            <p className={`mt-2 hidden text-[10px] font-semibold sm:block ${index === step ? "text-white" : "text-white/30"}`}>{item}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[30px] border border-white/8 bg-white/[0.035] p-5 sm:p-8">
        {step === 0 && (
          <StepBlock icon={MapPin} title="Where should we collect it?">
            <PickupAddressField value={form.pickup} onChange={(value) => update("pickup", value)} offices={pickupOffices} />
            <div className="mt-3 grid grid-cols-2 gap-3">
              <button onClick={useCurrentLocation} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left text-xs font-bold text-white/70">
                Use my location
                <span className="mt-1 block text-[11px] font-normal text-white/35">For a custom collection point</span>
              </button>
              <button onClick={() => navigate("/settings/addresses")} className="rounded-2xl border border-cargo-yellow/30 bg-cargo-yellow/10 p-4 text-left text-xs font-bold text-cargo-yellow">
                Saved address
                <span className="mt-1 block text-[11px] font-normal text-white/35">Choose a previously used location</span>
              </button>
            </div>
          </StepBlock>
        )}

        {step === 1 && (
          <StepBlock icon={UserRound} title="Who should we contact?">
            <label className="mb-4 block">
              <span className="mb-2 block text-xs font-bold text-white/35">Use a saved recipient</span>
              <select
                defaultValue=""
                onChange={(event) => {
                  const saved = savedRecipients.find((recipient: { id: string }) => recipient.id === event.target.value);
                  if (!saved) return;
                  setForm((current) => ({ ...current, recipient: saved.name, phone: saved.phone, destination: current.destination || saved.location }));
                }}
                className="h-12 w-full rounded-2xl border border-white/10 bg-ink/35 px-4 text-sm font-semibold text-white outline-none focus:border-cargo-yellow/60"
              >
                <option value="" className="text-ink">Choose a saved recipient</option>
                {savedRecipients.map((recipient: { id: string; name: string; location: string }) => <option key={recipient.id} value={recipient.id} className="text-ink">{recipient.name} · {recipient.location}</option>)}
              </select>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Cargo owner" icon={UserRound} value={form.recipient} onChange={(value) => update("recipient", value)} />
              <Field label="Phone number" icon={Phone} value={form.phone} onChange={(value) => update("phone", value)} />
            </div>
            <label className="mt-5 block">
              <span className="mb-2 block text-xs font-bold text-white/35">Notes for the cargo owner or sender (optional)</span>
              <textarea
                value={form.recipientNotes}
                onChange={(event) => update("recipientNotes", event.target.value)}
                placeholder="Add any extra information we should know about this cargo."
                rows={3}
                className="w-full resize-none rounded-2xl border border-white/10 bg-ink/35 px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-white/30 focus:border-cargo-yellow/60"
              />
            </label>
            <button onClick={saveRecipient} className="mt-4 text-xs font-bold text-cargo-yellow">
              + Save this contact
            </button>
          </StepBlock>
        )}

        {step === 2 && (
          <StepBlock icon={Package} title="Tell us about the cargo">
            <div className="space-y-3">
              <div className="grid grid-cols-[minmax(0,1fr)_96px_40px] gap-2 px-1 text-[11px] font-bold text-white/35">
                <span>Cargo name</span><span>Quantity</span><span className="sr-only">Remove</span>
              </div>
              {cargoRows.map((row, index) => (
                <div key={row.id} className="grid grid-cols-[minmax(0,1fr)_96px_40px] items-center gap-2">
                  <input value={row.name} onChange={(event) => updateCargoRow(row.id, "name", event.target.value)} placeholder={index === 0 ? "e.g. Chairs" : "Another item"} className="h-12 min-w-0 rounded-2xl border border-white/10 bg-ink/35 px-4 text-sm font-semibold text-white outline-none placeholder:text-white/30 focus:border-cargo-yellow/60" aria-label={`Cargo item ${index + 1}`} />
                  <input type="number" min="1" value={row.quantity} onChange={(event) => updateCargoRow(row.id, "quantity", event.target.value)} className="h-12 min-w-0 rounded-2xl border border-white/10 bg-ink/35 px-3 text-center text-sm font-semibold text-white outline-none focus:border-cargo-yellow/60" aria-label={`Quantity for cargo item ${index + 1}`} />
                  <button type="button" onClick={() => removeCargoRow(row.id)} disabled={cargoRows.length === 1} className="grid size-10 place-items-center rounded-xl border border-white/10 text-white/45 transition hover:border-cargo-yellow/50 hover:text-cargo-yellow disabled:cursor-not-allowed disabled:opacity-30" aria-label={`Remove cargo item ${index + 1}`}><X className="size-4" /></button>
                </div>
              ))}
              <button type="button" onClick={addCargoRow} className="inline-flex items-center gap-2 rounded-xl px-1 py-2 text-xs font-bold text-cargo-yellow"><Plus className="size-4" /> Add another cargo row</button>
            </div>
            <label className="mt-4 block">
              <span className="mb-2 block text-xs font-bold text-white/35">Additional cargo description (optional)</span>
              <textarea
                value={form.contents}
                onChange={(event) => update("contents", event.target.value)}
                placeholder="Add helpful detail about the items, condition, or packaging."
                rows={3}
                className="w-full resize-none rounded-2xl border border-white/10 bg-ink/35 px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-white/30 focus:border-cargo-yellow/60"
              />
            </label>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <EvidenceUpload
                id="cargo-photos"
                title="Add photos"
                description="Optional images of the parcel or items"
                icon={ImagePlus}
                accept="image/*"
                multiple
                onFiles={(files) => addEvidence("photos", files)}
              />
              <EvidenceUpload
                id="cargo-document"
                title="Upload debit or delivery note"
                description="Attach the supplier’s supporting document"
                icon={FileText}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onFiles={(files) => addEvidence("documents", files)}
              />
            </div>
            <EvidenceList type="photos" items={evidence.photos} onRemove={(name) => removeEvidence("photos", name)} />
            <EvidenceList type="documents" items={evidence.documents} onRemove={(name) => removeEvidence("documents", name)} />
          </StepBlock>
        )}

        {step === 3 && (
          <StepBlock icon={Plane} title="Choose transport and arrival">
            <p className="mb-3 text-xs font-bold text-white/40">How should the cargo travel?</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {isReferenceDataLoading ? <p className="text-sm text-white/45">Loading service options…</p> : transportOptions.map((option) => {
                const Icon = option.id === "air" ? Plane : ShipWheel;
                return (
                  <button
                    key={option.id}
                    onClick={() => setTransport(option.id)}
                    className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${transport === option.id ? "border-cargo-yellow bg-cargo-yellow/10" : "border-white/8 bg-white/[0.03] hover:border-white/20"}`}
                  >
                    <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${transport === option.id ? "bg-cargo-yellow text-ink" : "bg-white/8 text-white/55"}`}>
                      <Icon className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold">{option.name}</span>
                        {transport === option.id && <Check className="size-4 text-cargo-yellow" />}
                      </span>
                      <span className="mt-1 block text-xs text-white/42">{option.detail}</span>
                      <span className="mt-3 block text-xs font-semibold text-cargo-yellow">Indicative transit: {option.eta}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="mb-3 mt-7 text-xs font-bold text-white/40">When it arrives, how should we hand it over?</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <ChoiceCard
                active={handover === "collect"}
                icon={Warehouse}
                title="Collect from office"
                description="We’ll notify you when your cargo is ready for collection."
                onClick={() => setHandover("collect")}
              />
              <ChoiceCard
                active={handover === "delivery"}
                icon={Home}
                title="Deliver to my address"
                description="Add a final address for local delivery after arrival."
                onClick={() => setHandover("delivery")}
              />
            </div>
            {handover === "delivery" && (
              <div className="mt-4">
                <Field label="Final delivery address" icon={Home} value={form.destination} onChange={(value) => update("destination", value)} />
                <p className="mt-2 text-xs font-semibold text-cargo-yellow">Home delivery may add a local delivery fee. We’ll confirm availability and the exact charge before delivery.</p>
              </div>
            )}
          </StepBlock>
        )}

        {step === 4 && (
          <StepBlock icon={FileText} title="Review cargo request">
            <div className="divide-y divide-white/8 rounded-2xl bg-white/[0.035]">
              {[
                ["Pickup", form.pickup || "Not selected"],
                ["Cargo owner", `${form.recipient} · ${form.phone}`],
                ["Recipient notes", form.recipientNotes || "None added"],
                ["Cargo items", cargoRows.filter((row) => row.name.trim()).map((row) => `${row.name} × ${row.quantity || "1"}`).join(", ") || "Not described"],
                ["Description", form.contents || "None added"],
                ["Evidence", `${evidence.photos.length} photo${evidence.photos.length === 1 ? "" : "s"} · ${evidence.documents.length} document${evidence.documents.length === 1 ? "" : "s"}`],
                ["Transport", `${selectedTransport.name} · ${selectedTransport.eta}`],
                ["Arrival handover", handover === "collect" ? "Collect from office" : form.destination || "Deliver to my address"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-4 p-4 text-sm">
                  <span className="text-white/40">{label}</span>
                  <span className="max-w-[65%] text-right font-semibold">{value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-cargo-yellow/20 bg-cargo-yellow/8 p-4">
              <FileText className="mt-0.5 size-5 shrink-0 text-cargo-yellow" />
              <div>
                <p className="text-sm font-bold">Pay your booking deposit now</p>
                <p className="mt-1 text-xs text-white/40">A K 320 booking deposit secures your cargo request. You can pay by mobile money or ATM/debit card; any final service charge is confirmed later.</p>
              </div>
            </div>
          </StepBlock>
        )}

        <div className="mt-8 flex flex-col gap-3 border-t border-white/8 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={goBack} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-bold text-white/65 transition hover:border-cargo-yellow/50 hover:text-cargo-yellow">
              <ArrowLeft className="size-4" />
              Back
            </button>
            <button onClick={saveDraft} className="rounded-2xl border border-cargo-yellow/35 bg-cargo-yellow/10 px-4 py-3 text-sm font-bold text-cargo-yellow transition hover:border-cargo-yellow hover:bg-cargo-yellow/15">
              Save as Draft
            </button>
          </div>
          <button onClick={next} className="flex items-center justify-center gap-2 rounded-2xl bg-cargo-yellow px-6 py-3 text-sm font-bold text-ink transition hover:brightness-105">
            {step === 4 ? "Pay K 320 & create request" : "Continue"}
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
      <PaymentModal open={paymentOpen} amount="K 320" reference="Cargo request booking deposit" onClose={() => setPaymentOpen(false)} onSuccess={() => { setPaymentOpen(false); toast("Booking deposit received."); setSuccess(true); }} />
    </div>
  );
}

function StepBlock({ icon: Icon, title, children }: { icon: typeof MapPin; title: string; children: React.ReactNode }) {
  return <div><div className="flex items-center gap-4"><div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-cargo-yellow/12 text-cargo-yellow"><Icon className="size-5" /></div><h2 className="font-heading text-xl font-bold">{title}</h2></div><div className="mt-8">{children}</div></div>;
}

function Field({ label, icon: Icon, value, onChange, type = "text" }: { label: string; icon: typeof MapPin; value: string; onChange: (value: string) => void; type?: string }) {
  return <label className="block"><span className="mb-2 block text-xs font-bold text-white/35">{label}</span><div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-ink/35 px-4"><Icon className="size-4 shrink-0 text-white/30" /><input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-12 min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/30" /></div></label>;
}

function PickupAddressField({ value, onChange, offices }: { value: string; onChange: (value: string) => void; offices: { id: string; name: string; address: string; detail: string }[] }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const normalized = value.trim().toLowerCase();
  const suggestions = offices.filter((office) => !normalized || `${office.name} ${office.address} ${office.detail}`.toLowerCase().includes(normalized));
  const selectOffice = (address: string) => { onChange(address); setOpen(false); setActiveIndex(-1); };
  const optionId = (index: number) => `pickup-office-${index}`;
  return <label className="relative block"><span className="mb-2 block text-xs font-bold text-white/35">Pickup address</span><div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-ink/35 px-4"><MapPin className="size-4 shrink-0 text-white/30" /><input value={value} onChange={(event) => { onChange(event.target.value); setOpen(true); setActiveIndex(-1); }} onFocus={() => setOpen(true)} onBlur={() => window.setTimeout(() => setOpen(false), 120)} onKeyDown={(event) => { if (event.key === "Escape") { setOpen(false); setActiveIndex(-1); } if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); setActiveIndex((current) => Math.min(current + 1, suggestions.length - 1)); } if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((current) => Math.max(current - 1, 0)); } if (event.key === "Enter" && open && activeIndex >= 0 && suggestions[activeIndex]) { event.preventDefault(); selectOffice(suggestions[activeIndex].address); } }} className="h-12 min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/30" placeholder="Select an office or type an address" role="combobox" aria-expanded={open} aria-controls="pickup-office-list" aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined} aria-autocomplete="list" /></div>{open && <div id="pickup-office-list" role="listbox" className="mt-2 overflow-hidden rounded-2xl border border-white/10 bg-white p-1.5">{suggestions.length ? <><p className="px-3 py-2 text-[11px] font-semibold text-white/45">New World Cargo offices</p>{suggestions.map((office, index) => <button key={office.id} id={optionId(index)} type="button" role="option" aria-selected={activeIndex === index} onMouseDown={(event) => event.preventDefault()} onClick={() => selectOffice(office.address)} className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition ${activeIndex === index ? "bg-cargo-yellow/15" : "hover:bg-white/8"}`}><span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-cargo-yellow/15 text-cargo-yellow"><Building2 className="size-4" /></span><span className="min-w-0"><span className="block text-sm font-bold text-white">{office.name}</span><span className="mt-0.5 block text-xs text-white/45">{office.address}</span><span className="mt-1 block text-[11px] text-white/30">{office.detail}</span></span></button>)}</> : <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => setOpen(false)} className="w-full rounded-xl px-3 py-3 text-left text-sm font-semibold text-white/65 hover:bg-white/8">Use “{value}” as the pickup address</button>}</div>}</label>;
}

function EvidenceUpload({ id, title, description, icon: Icon, accept, multiple = false, onFiles }: { id: string; title: string; description: string; icon: typeof Upload; accept: string; multiple?: boolean; onFiles: (files: FileList | null) => void }) {
  return <label htmlFor={id} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-4 transition hover:border-cargo-yellow/50 hover:bg-cargo-yellow/5"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-cargo-yellow/12 text-cargo-yellow"><Icon className="size-5" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-bold">{title}</span><span className="mt-1 block text-xs text-white/42">{description}</span></span><Upload className="mt-1 size-4 shrink-0 text-white/35" /><input id={id} type="file" accept={accept} multiple={multiple} className="sr-only" onChange={(event) => { onFiles(event.target.files); event.currentTarget.value = ""; }} /></label>;
}

function EvidenceList({ type, items, onRemove }: { type: "photos" | "documents"; items: string[]; onRemove: (name: string) => void }) {
  if (!items.length) return null;
  return <div className="mt-3 flex flex-wrap gap-2">{items.map((item) => <span key={`${type}-${item}`} className="flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-1.5 pl-3 pr-1.5 text-xs font-semibold text-white/65"><span className="truncate">{item}</span><button type="button" onClick={() => onRemove(item)} aria-label={`Remove ${item}`} className="grid size-5 shrink-0 place-items-center rounded-full text-white/50 hover:bg-white/10 hover:text-white"><X className="size-3" /></button></span>)}</div>;
}

function ChoiceCard({ active, icon: Icon, title, description, onClick }: { active: boolean; icon: typeof Home; title: string; description: string; onClick: () => void }) {
  return <button onClick={onClick} className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${active ? "border-cargo-yellow bg-cargo-yellow/10" : "border-white/8 bg-white/[0.03] hover:border-white/20"}`}><span className={`grid size-10 shrink-0 place-items-center rounded-xl ${active ? "bg-cargo-yellow text-ink" : "bg-white/8 text-white/55"}`}><Icon className="size-5" /></span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className="text-sm font-bold">{title}</span>{active && <Check className="size-4 text-cargo-yellow" />}</span><span className="mt-1 block text-xs text-white/42">{description}</span></span></button>;
}
