import { ArrowLeft, Pencil, Plus, Search, Trash2, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { FormDialogContent } from "@/components/form-dialog-content";
import { Button } from "@/components/ui/button";
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Recipient } from "@/lib/domain";
import { recipients as seedRecipients } from "@/lib/mock-data";
import { readMockRecord, writeMockRecord } from "@/lib/mock-repository";

const storageKey = "new-world-cargo-recipients";
const initials = (name: string) => name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "NW";

type RecipientForm = Pick<Recipient, "name" | "phone" | "location">;
const emptyForm: RecipientForm = { name: "", phone: "", location: "" };

function RecipientFormDialog({ open, recipient, onOpenChange, onSave }: { open: boolean; recipient: Recipient | null; onOpenChange: (open: boolean) => void; onSave: (form: RecipientForm) => void }) {
  const [form, setForm] = useState<RecipientForm>(emptyForm);
  useEffect(() => { setForm(recipient ? { name: recipient.name, phone: recipient.phone, location: recipient.location } : emptyForm); }, [recipient, open]);
  const update = (field: keyof RecipientForm, value: string) => setForm((previous) => ({ ...previous, [field]: value }));
  const submit = (event: React.FormEvent) => { event.preventDefault(); onSave(form); setForm(emptyForm); };
  return <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) setForm(emptyForm); onOpenChange(nextOpen); }}>
    <FormDialogContent>
      <DialogHeader><DialogTitle>{recipient ? "Edit recipient" : "Add recipient"}</DialogTitle><DialogDescription>These details are available when you start a shipment.</DialogDescription></DialogHeader>
      <form onSubmit={submit} className="grid gap-4">
        <label className="grid gap-2 text-xs font-bold">Name<input required autoFocus value={form.name} onChange={(event) => update("name", event.target.value)} className="h-11 rounded-xl border border-ink/15 px-3 text-sm" /></label>
        <label className="grid gap-2 text-xs font-bold">Phone<input required value={form.phone} onChange={(event) => update("phone", event.target.value)} className="h-11 rounded-xl border border-ink/15 px-3 text-sm" /></label>
        <label className="grid gap-2 text-xs font-bold">City or location<input required value={form.location} onChange={(event) => update("location", event.target.value)} className="h-11 rounded-xl border border-ink/15 px-3 text-sm" /></label>
        <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl font-bold">Cancel</Button><Button type="submit" className="rounded-xl bg-cargo-yellow font-bold text-ink">Save recipient</Button></DialogFooter>
      </form>
    </FormDialogContent>
  </Dialog>;
}

export default function Recipients() {
  const [, navigate] = useLocation();
  const [items, setItems] = useState<Recipient[]>(() => readMockRecord(storageKey, seedRecipients));
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Recipient | null>(null);
  const shown = useMemo(() => items.filter((item) => `${item.name} ${item.location} ${item.phone}`.toLowerCase().includes(query.toLowerCase())), [items, query]);
  const openForm = (recipient?: Recipient) => { setEditing(recipient || null); setOpen(true); };
  const saveItems = (next: Recipient[]) => { setItems(next); writeMockRecord(storageKey, next); };
  const saveRecipient = (form: RecipientForm) => {
    const value: Recipient = { id: editing?.id || `recipient-${Date.now()}`, ...form, initials: initials(form.name) };
    saveItems(editing ? items.map((item) => item.id === editing.id ? value : item) : [value, ...items]);
    setOpen(false);
  };
  const removeRecipient = (recipient: Recipient) => { if (confirm(`Delete ${recipient.name}?`)) saveItems(items.filter((item) => item.id !== recipient.id)); };

  return <div className="mx-auto max-w-3xl text-ink">
    <button onClick={() => navigate("/settings")} className="flex items-center gap-2 text-sm font-bold text-ink/55 hover:text-ink"><ArrowLeft className="size-4" /> Back to settings</button>
    <div className="mt-7 flex items-start gap-4"><span className="grid size-12 place-items-center rounded-2xl bg-cargo-yellow text-ink"><UserRound className="size-5" /></span><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-cargo-yellow">Settings</p><h1 className="mt-1 font-heading text-3xl font-extrabold">Saved recipients</h1><p className="mt-2 text-sm text-ink/55">Save people and businesses you send cargo to, then reuse them in a shipment.</p></div></div>
    <div className="mt-6 flex flex-col gap-3 sm:flex-row"><label className="flex h-12 flex-1 items-center gap-2 rounded-2xl border border-ink/12 bg-white px-4"><Search className="size-4 text-ink/40" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search recipients" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink/35" /></label><Button onClick={() => openForm()} className="h-12 rounded-2xl bg-cargo-yellow font-bold text-ink"><Plus className="mr-2 size-4" /> Add recipient</Button></div>
    <div className="mt-4 overflow-hidden rounded-[26px] border border-ink/10 bg-white">{shown.length ? shown.map((recipient, index) => <div key={recipient.id} className={`flex items-center gap-3 p-4 sm:p-5 ${index ? "border-t border-ink/8" : ""}`}><span className="grid size-11 shrink-0 place-items-center rounded-full bg-cargo-yellow/25 text-xs font-extrabold">{recipient.initials}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{recipient.name}</p><p className="mt-1 truncate text-xs text-ink/50">{recipient.location} · {recipient.phone}</p></div><div className="flex gap-1"><button onClick={() => openForm(recipient)} className="grid size-9 place-items-center rounded-xl border border-ink/10 text-ink/55 hover:border-cargo-yellow" aria-label={`Edit ${recipient.name}`}><Pencil className="size-4" /></button><button onClick={() => removeRecipient(recipient)} className="grid size-9 place-items-center rounded-xl border border-ink/10 text-ink/55 hover:border-cargo-yellow" aria-label={`Delete ${recipient.name}`}><Trash2 className="size-4" /></button></div></div>) : <div className="p-8 text-center"><p className="text-sm font-bold">No recipients found</p><p className="mt-1 text-xs text-ink/50">Try another search or add a new recipient.</p></div>}</div>
    <RecipientFormDialog open={open} recipient={editing} onOpenChange={setOpen} onSave={saveRecipient} />
  </div>;
}
