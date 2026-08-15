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
  Plane,
  ShipWheel,
  Upload,
  UserRound,
  Warehouse,
  X,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { cargoTransportOptions, pickupOfficeSuggestions } from "@/lib/mock-data";
import { CargoRail } from "@/components/shipment-ui";

const steps = ["Pickup", "Recipient", "Cargo", "Transport", "Review"];

type EvidenceState = {
  photos: string[];
  documents: string[];
};

export default function SendShipment() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [success, setSuccess] = useState(false);
  const [transport, setTransport] = useState<"air" | "sea">("air");
  const [handover, setHandover] = useState<"collect" | "delivery">("collect");
  const [evidence, setEvidence] = useState<EvidenceState>({ photos: [], documents: [] });
  const [form, setForm] = useState({
    pickup: "",
    recipient: "Amina Banda",
    phone: "+260 977 123 456",
    destination: "",
    contents: "",
    packages: "",
  });

  const update = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const addEvidence = (type: keyof EvidenceState, files: FileList | null) => {
    if (!files?.length) return;
    const names = Array.from(files).map((file) => file.name);
    setEvidence((current) => ({ ...current, [type]: [...current[type], ...names] }));
    toast(`${names.length} ${type === "photos" ? "photo" : "document"}${names.length > 1 ? "s" : ""} added.`);
  };

  const removeEvidence = (type: keyof EvidenceState, name: string) =>
    setEvidence((current) => ({ ...current, [type]: current[type].filter((item) => item !== name) }));

  const next = () => (step < steps.length - 1 ? setStep((current) => current + 1) : setSuccess(true));
  const selectedTransport = cargoTransportOptions.find((option) => option.id === transport)!;

  if (success) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
        <div className="w-full rounded-[32px] border border-white/8 bg-white/[0.035] p-7 text-center sm:p-10">
          <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-mint text-ink">
            <Check className="size-8" strokeWidth={2.5} />
          </div>
          <p className="mt-6 text-xs font-bold text-mint">Cargo request created</p>
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
      <button
        onClick={() => (step ? setStep((current) => current - 1) : navigate("/"))}
        className="mb-6 inline-flex items-center gap-2 rounded-xl bg-cargo-yellow px-3.5 py-2.5 text-xs font-bold text-ink transition hover:brightness-105"
      >
        <ArrowLeft className="size-4" />
        {step ? "Previous step" : "Back home"}
      </button>

      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-cargo-yellow">New cargo request</p>
          <h1 className="mt-2 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">Send a package</h1>
          <p className="mt-2 text-sm text-white/45">Tell us what is coming, where it starts, and how you want to receive it.</p>
        </div>
        <span className="text-xs font-bold text-white/35">{step + 1} of {steps.length}</span>
      </div>

      <div className="mb-5">
        <CargoRail label="Cargo request" items={steps} active={step} />
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
          <StepBlock
            icon={MapPin}
            title="Where should we collect it?"
            subtitle="Choose a New World Cargo office or enter another pickup address."
          >
            <PickupAddressField value={form.pickup} onChange={(value) => update("pickup", value)} />
            <div className="mt-3 grid grid-cols-2 gap-3">
              <button onClick={() => toast("Location access requested.")} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left text-xs font-bold text-white/70">
                Use my location
                <span className="mt-1 block text-[11px] font-normal text-white/35">For a custom collection point</span>
              </button>
              <button onClick={() => toast("Saved addresses opened.")} className="rounded-2xl border border-cargo-yellow/30 bg-cargo-yellow/10 p-4 text-left text-xs font-bold text-cargo-yellow">
                Saved address
                <span className="mt-1 block text-[11px] font-normal text-white/35">Choose a previously used location</span>
              </button>
            </div>
          </StepBlock>
        )}

        {step === 1 && (
          <StepBlock icon={UserRound} title="Who should we contact?" subtitle="We’ll use these details for cargo updates and arrival notifications.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Cargo owner" icon={UserRound} value={form.recipient} onChange={(value) => update("recipient", value)} />
              <Field label="Phone number" icon={Phone} value={form.phone} onChange={(value) => update("phone", value)} />
            </div>
            <button onClick={() => toast("Contact saved to your address book.")} className="mt-4 text-xs font-bold text-cargo-yellow">
              + Save this contact
            </button>
          </StepBlock>
        )}

        {step === 2 && (
          <StepBlock
            icon={Package}
            title="Tell us about the cargo"
            subtitle="Describe what is in the parcel. You do not need to know the weight."
          >
            <div className="grid grid-cols-3 gap-2">
              {["General cargo", "Documents", "Personal items"].map((item) => (
                <button
                  key={item}
                  onClick={() => update("contents", item)}
                  className={`rounded-2xl border p-4 text-center text-xs font-bold ${form.contents === item ? "border-cargo-yellow bg-cargo-yellow/12 text-cargo-yellow" : "border-white/8 bg-white/[0.03] text-white/45"}`}
                >
                  {item}
                </button>
              ))}
            </div>
            <label className="mt-4 block">
              <span className="mb-2 block text-xs font-bold text-white/35">What is inside?</span>
              <textarea
                value={form.contents}
                onChange={(event) => update("contents", event.target.value)}
                placeholder="For example: household goods, clothing, phone accessories, or documents"
                rows={4}
                className="w-full resize-none rounded-2xl border border-white/10 bg-ink/35 px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-white/30 focus:border-cargo-yellow/60"
              />
            </label>
            <div className="mt-4 max-w-xs">
              <Field label="Estimated number of packages (optional)" icon={Package} value={form.packages} onChange={(value) => update("packages", value)} type="number" />
            </div>
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
          <StepBlock icon={Plane} title="Choose transport and arrival" subtitle="Select how the cargo travels, then tell us how you want to receive it.">
            <p className="mb-3 text-xs font-bold text-white/40">How should the cargo travel?</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {cargoTransportOptions.map((option) => {
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
                <p className="mt-2 text-xs text-white/40">We’ll confirm local delivery availability and the final charge when your cargo arrives.</p>
              </div>
            )}
          </StepBlock>
        )}

        {step === 4 && (
          <StepBlock icon={FileText} title="Review cargo request" subtitle="Check the information before we create a reference for your cargo.">
            <div className="divide-y divide-white/8 rounded-2xl bg-white/[0.035]">
              {[
                ["Pickup", form.pickup || "Not selected"],
                ["Cargo owner", `${form.recipient} · ${form.phone}`],
                ["Contents", form.contents || "Not described"],
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
                <p className="text-sm font-bold">Final charge comes later</p>
                <p className="mt-1 text-xs text-white/40">We’ll notify you of the final service charge before release, collection, or final delivery.</p>
              </div>
            </div>
          </StepBlock>
        )}

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-white/8 pt-6 sm:flex-row sm:justify-between">
          <button onClick={() => toast("Your cargo request draft has been saved.")} className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-bold text-white/55 transition hover:border-white/25 hover:text-white">
            Save as draft
          </button>
          <button onClick={next} className="flex items-center justify-center gap-2 rounded-2xl bg-cargo-yellow px-6 py-3 text-sm font-bold text-ink transition hover:brightness-105">
            {step === 4 ? "Create cargo request" : "Continue"}
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function StepBlock({ icon: Icon, title, subtitle, children }: { icon: typeof MapPin; title: string; subtitle: string; children: React.ReactNode }) {
  return <div><div className="flex items-start gap-4"><div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-cargo-yellow/12 text-cargo-yellow"><Icon className="size-5" /></div><div><h2 className="font-heading text-xl font-bold">{title}</h2><p className="mt-1 text-sm text-white/42">{subtitle}</p></div></div><div className="mt-8">{children}</div></div>;
}

function Field({ label, icon: Icon, value, onChange, type = "text" }: { label: string; icon: typeof MapPin; value: string; onChange: (value: string) => void; type?: string }) {
  return <label className="block"><span className="mb-2 block text-xs font-bold text-white/35">{label}</span><div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-ink/35 px-4"><Icon className="size-4 shrink-0 text-white/30" /><input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-12 min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/30" /></div></label>;
}

function PickupAddressField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const normalized = value.trim().toLowerCase();
  const suggestions = pickupOfficeSuggestions.filter((office) => !normalized || `${office.name} ${office.address} ${office.detail}`.toLowerCase().includes(normalized));
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
