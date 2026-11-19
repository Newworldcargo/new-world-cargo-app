import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { normalizeSupplierPhone, type SupplierContactFields } from "@/lib/supplier-payment-draft";
import { primaryPaymentAction, secondaryPaymentAction } from "@/lib/payment-presentation";

export const emptySupplierContact: SupplierContactFields = { supplier_name: "", supplier_phone: "", supplier_email: "" };

export function SupplierContactDialog({ contact, editing, onClose, onSave }: {
  contact: SupplierContactFields;
  editing: boolean;
  onClose: () => void;
  onSave: (contact: SupplierContactFields) => void;
}) {
  const [draft, setDraft] = useState(contact);
  const [phoneError, setPhoneError] = useState("");
  const change = (field: keyof SupplierContactFields, value: string) => setDraft(current => ({ ...current, [field]: value }));
  const labelClass = "grid gap-1.5 text-sm font-semibold";
  const controlClass = "h-12 rounded-xl border-ink/20 bg-white text-base";

  function submit(event: FormEvent) {
    event.preventDefault();
    const phone = normalizeSupplierPhone(draft.supplier_phone);
    if (!phone) {
      setPhoneError("Enter the supplier’s phone number with its country code.");
      return;
    }
    onSave({ supplier_name: draft.supplier_name.trim(), supplier_phone: phone, supplier_email: draft.supplier_email.trim() });
  }

  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-2xl border-[#dce6ee] bg-white text-ink sm:max-w-md">
      <DialogTitle>{editing ? "Edit supplier" : "Add supplier"}</DialogTitle>
      <DialogDescription className="text-ink/75">Enter the contact details for this supplier.</DialogDescription>
      <form className="grid gap-4" onSubmit={submit}>
        <label className={labelClass}>Supplier or company name
          <Input autoComplete="organization" required maxLength={160} pattern=".*\S.*" className={controlClass}
            value={draft.supplier_name} onChange={event => change("supplier_name", event.target.value)} />
        </label>
        <label className={labelClass}>Supplier phone number
          <Input autoComplete="tel" type="tel" inputMode="tel" required maxLength={32} className={controlClass}
            placeholder="+86 138 0013 8000" aria-invalid={Boolean(phoneError)} aria-describedby="supplier-phone-help"
            value={draft.supplier_phone} onChange={event => { change("supplier_phone", event.target.value); setPhoneError(""); }} />
        </label>
        <p id="supplier-phone-help" role={phoneError ? "alert" : undefined} className={phoneError ? "-mt-2 text-xs text-red-700" : "-mt-2 text-xs text-ink/75"}>
          {phoneError || "Include the country code, such as +86 or +971."}
        </p>
        <label className={labelClass}><span>Supplier email <span className="font-normal text-ink/70">(optional)</span></span>
          <Input type="email" autoComplete="email" maxLength={254} className={controlClass}
            value={draft.supplier_email} onChange={event => change("supplier_email", event.target.value)} />
        </label>
        <div className="mt-1 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" className={secondaryPaymentAction} onClick={onClose}>Cancel</Button>
          <Button type="submit" className={primaryPaymentAction}>Save supplier</Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>;
}
