import { ArrowLeft, CheckCircle2, Headphones, Paperclip, Plus, Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { useCompleteFileUploadMutation, useCustomerSupportCases, useFileUploadIntentMutation, useSupportCaseMutation } from "@/api/hooks";
import { EmptyState, ErrorState, LoadingState } from "@/components/async-state";
import { Button } from "@/components/ui/button";

const statusLabel = { open: "Open", in_review: "In review", resolved: "Resolved" } as const;

export default function Support() {
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ category: "Delivery question", subject: "", detail: "" });
  const [attachment, setAttachment] = useState<File | null>(null);
  const casesQuery = useCustomerSupportCases();
  const createCase = useSupportCaseMutation();
  const createUploadIntent = useFileUploadIntentMutation();
  const completeUpload = useCompleteFileUploadMutation();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    let attachmentFileId: string | null = null;
    if (attachment) {
      const intent = await createUploadIntent.mutateAsync({ filename: attachment.name, contentType: attachment.type || "application/octet-stream", sizeBytes: attachment.size, purpose: "support-attachment" });
      const uploadResponse = await fetch(intent.uploadUrl, {
        method: "PUT",
        headers: intent.headers,
        body: attachment,
      });
      if (!uploadResponse.ok) throw new Error("The attachment could not be uploaded.");
      await completeUpload.mutateAsync(intent.fileId);
      attachmentFileId = intent.fileId;
    }
    await createCase.mutateAsync({ ...form, attachmentFileId });
    setSent(true);
    setOpen(false);
    setForm({ category: "Delivery question", subject: "", detail: "" });
    setAttachment(null);
  };

  if (casesQuery.isLoading) return <LoadingState label="Loading support cases…" />;
  if (casesQuery.isError) return <ErrorState title="We could not load support cases" detail="Please try again." action={{ label: "Try again", onClick: () => casesQuery.refetch() }} />;

  return <div className="mx-auto max-w-3xl text-ink">
    <button type="button" onClick={() => navigate("/")} className="flex items-center gap-2 text-sm font-bold text-ink/55"><ArrowLeft className="size-4" /> Back home</button>
    <div className="mt-7 flex items-start gap-4"><span className="grid size-12 place-items-center rounded-2xl bg-cargo-yellow"><Headphones className="size-5" /></span><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-cargo-yellow">Support</p><h1 className="mt-1 font-heading text-3xl font-extrabold">How can we help?</h1><p className="mt-2 text-sm text-ink/55">Get help with a shipment, delivery, payment, or account question.</p></div></div>
    {sent && <div className="mt-5 flex items-center gap-3 rounded-2xl border border-cargo-yellow/45 bg-cargo-yellow/15 p-4 text-sm font-bold"><CheckCircle2 className="size-5" /> Your support case was created. We will contact you using your verified details.</div>}
    {(createCase.isError || createUploadIntent.isError || completeUpload.isError) && <div className="mt-5 rounded-2xl border border-ink/15 bg-white p-4 text-sm text-ink/70">We could not create the support case. Please try again.</div>}
    <div className="mt-6 grid gap-4 sm:grid-cols-3"><a href="tel:+260000000000" className="rounded-2xl border border-ink/10 bg-white p-4 text-sm font-bold hover:border-cargo-yellow">Call support<span className="mt-1 block text-xs font-normal text-ink/50">Speak to our team</span></a><a href="mailto:support@newworldcargo.com" className="rounded-2xl border border-ink/10 bg-white p-4 text-sm font-bold hover:border-cargo-yellow">Email support<span className="mt-1 block text-xs font-normal text-ink/50">Send a detailed request</span></a><button type="button" onClick={() => setOpen(true)} className="rounded-2xl bg-cargo-yellow p-4 text-left text-sm font-bold text-ink">Report an issue<span className="mt-1 block text-xs font-normal text-ink/65">Create a support case</span></button></div>
    <div className="mt-6 overflow-hidden rounded-[26px] border border-ink/10 bg-white"><div className="flex items-center justify-between p-5"><div><h2 className="font-heading text-lg font-extrabold">Your support cases</h2><p className="mt-1 text-xs text-ink/50">Track questions and reported issues.</p></div><button type="button" onClick={() => setOpen(true)} className="grid size-9 place-items-center rounded-xl bg-cargo-yellow text-ink"><Plus className="size-4" /></button></div>{casesQuery.data?.length ? casesQuery.data.map((item, index) => <div key={item.id} className={`flex items-center gap-3 px-5 py-4 ${index ? "border-t border-ink/8" : ""}`}><span className="grid size-9 place-items-center rounded-xl bg-cargo-yellow/20 text-xs font-extrabold">?</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{item.subject}</p><p className="mt-1 text-xs text-ink/50">{item.id} · {item.category} · {item.displayCreatedAt}</p></div><span className="rounded-full bg-cargo-yellow/25 px-2 py-1 text-[10px] font-bold">{statusLabel[item.status]}</span></div>) : <div className="p-5"><EmptyState title="No support cases" detail="Create a case when you need help with a shipment, payment, or account." /></div>}</div>
    {open && <div className="fixed inset-0 z-50 grid place-items-center bg-ink/35 p-4"><form onSubmit={(event) => { void submit(event); }} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[26px] bg-white p-6"><h2 className="font-heading text-xl font-extrabold">Report an issue</h2><p className="mt-1 text-xs text-ink/55">Include enough detail for the team to help you quickly.</p><div className="mt-5 grid gap-3"><label className="grid gap-2 text-xs font-bold">Category<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="h-11 rounded-xl border border-ink/15 px-3 text-sm"><option>Delivery question</option><option>Shipment update</option><option>Payment or invoice</option><option>Damaged or missing item</option><option>Account help</option></select></label><label className="grid gap-2 text-xs font-bold">Subject<input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="h-11 rounded-xl border border-ink/15 px-3 text-sm" /></label><label className="grid gap-2 text-xs font-bold">What happened?<textarea required value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} rows={4} className="rounded-xl border border-ink/15 px-3 py-2 text-sm" /></label><label className="flex h-11 items-center gap-2 rounded-xl border border-ink/15 px-3 text-xs font-bold"><Paperclip className="size-4" /> Attach photo or file<input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => setAttachment(e.target.files?.[0] ?? null)} className="sr-only" /><span className="ml-auto truncate text-ink/45">{attachment?.name || "Optional"}</span></label></div><div className="mt-5 flex gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1 rounded-xl font-bold">Cancel</Button><Button disabled={createCase.isPending || createUploadIntent.isPending || completeUpload.isPending} className="flex-1 rounded-xl bg-cargo-yellow font-bold text-ink"><Send className="mr-2 size-4" />{createCase.isPending || createUploadIntent.isPending || completeUpload.isPending ? "Sending…" : "Send case"}</Button></div></form></div>}
  </div>;
}
