import { Banknote, Building2, Check, CreditCard, Plus, Smartphone } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supplierMethodLabels } from "@/components/supplier-payment-record";
import { ContentSkeleton } from "@/components/loading-skeleton";
import type { SavedSupplier, SupplierPaymentMethod } from "@/lib/supplier-payment-draft";

const profileButton = "group flex w-[5.5rem] shrink-0 flex-col items-center gap-2 rounded-xl p-1.5 text-center focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#012642]";
const methodOptions = [
  { value: "mobile_money", icon: Smartphone },
  { value: "card", icon: CreditCard },
  { value: "atm_deposit", icon: Banknote },
  { value: "office_cash", icon: Building2 },
] as const;

export function SupplierProfiles({ contacts, selectedId, loading, onAdd, onSelect }: {
  contacts: SavedSupplier[];
  selectedId: string;
  loading?: boolean;
  onAdd: () => void;
  onSelect: (id: string) => void;
}) {
  return <div role="group" aria-label="Choose a supplier" className="-mx-1 flex min-w-0 gap-1 overflow-x-auto overscroll-x-contain px-1 pb-2 pt-1">
    <button type="button" onClick={onAdd} aria-haspopup="dialog" className={profileButton}>
      <span className="grid size-14 place-items-center rounded-full border border-dashed border-[#9eb6c7] bg-[#f1f6fa] transition-colors group-hover:bg-[#e3edf5]">
        <Plus className="size-5 text-ink" aria-hidden="true" />
      </span>
      <span className="text-xs font-semibold">Add supplier</span>
    </button>
    {contacts.map(contact => {
      const selected = contact.id === selectedId;
      const title = [contact.name, contact.phone, contact.email].filter(Boolean).join(" · ");
      const initials = contact.name.trim().split(/\s+/).slice(0, 2)
        .map(word => Array.from(word)[0]).join("").toLocaleUpperCase();
      return <button key={contact.id} type="button" onClick={() => onSelect(contact.id)} aria-pressed={selected}
        aria-label={`Select ${title}`} title={title} className={profileButton}>
        <span className="relative">
          <Avatar className={`size-14 border transition-colors ${selected ? "border-[#012642] ring-2 ring-[#012642] ring-offset-2" : "border-[#cedde8] group-hover:border-[#7998af]"}`}>
            {contact.avatarUrl && <AvatarImage src={contact.avatarUrl} alt="" referrerPolicy="no-referrer" />}
            <AvatarFallback className="bg-[#e7f0f7] text-sm font-semibold text-ink" aria-hidden="true">{initials || "?"}</AvatarFallback>
          </Avatar>
          {selected && <span className="absolute -bottom-0.5 -right-0.5 grid size-5 place-items-center rounded-full border-2 border-white bg-[#012642] text-[#fff]" aria-hidden="true"><Check className="size-3" /></span>}
        </span>
        <span className="line-clamp-2 break-words text-xs font-semibold">{contact.name}</span>
      </button>;
    })}
    {loading && <div className="min-w-0 flex-1"><ContentSkeleton variant="profiles" label="Loading saved suppliers" /></div>}
  </div>;
}

export function SupplierPaymentMethods({ method, currency, onChange }: {
  method?: SupplierPaymentMethod;
  currency: string;
  onChange: (method: SupplierPaymentMethod) => void;
}) {
  return <fieldset className="min-w-0">
    <legend className="mb-2 text-sm font-semibold">How you’d like to pay</legend>
    <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
      {methodOptions.map(({ value, icon: Icon }) => {
        const selected = method === value;
        const unavailable = value === "mobile_money" && currency !== "ZMW" || value === "card" && !["ZMW", "USD"].includes(currency);
        return <label key={value} className={`relative flex min-w-0 flex-col items-start gap-2 rounded-xl border p-3 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#012642] ${unavailable ? "cursor-not-allowed border-[#d5e2eb] bg-[#f3f6f8]" : selected ? "cursor-pointer border-[#012642] bg-[#eaf2f8]" : "cursor-pointer border-[#d5e2eb] bg-white hover:border-[#a9bfce] hover:bg-[#f3f7fa]"}`}>
          <input className="sr-only" type="radio" name="supplier-payment-method" value={value} checked={selected} disabled={unavailable} onChange={() => onChange(value)} />
          <span className="grid size-8 place-items-center rounded-lg bg-[#edf3f8] text-ink"><Icon className="size-4" aria-hidden="true" /></span>
          <span className={`absolute right-3 top-3 grid size-4 place-items-center rounded-full border ${selected ? "border-[#012642] bg-[#012642] text-[#fff]" : "border-[#9eb6c7] bg-white"}`} aria-hidden="true">
            {selected && <Check className="size-3" />}
          </span>
          <span className="text-xs font-semibold sm:text-sm">{supplierMethodLabels[value]}</span>
          {unavailable && <span className="text-xs text-ink/75">{value === "mobile_money" ? "ZMW only" : "ZMW or USD"}</span>}
        </label>;
      })}
    </div>
  </fieldset>;
}
