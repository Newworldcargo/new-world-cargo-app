// New World Cargo billing style: white operational workspace, Poppins hierarchy, navy ink, Cargo Yellow actions, restrained borders, mobile-first layout.

import { ArrowDownToLine, ArrowLeft, ArrowUpRight, CalendarDays, Check, ChevronRight, CircleAlert, Download, FileText, Package, ReceiptText, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import type { Invoice, InvoiceStatus } from "@/lib/domain";
import { PaymentModal, type PaymentConfirmation } from "@/components/payment-modal";
import { feedback } from "@/lib/feedback";
import { useCustomerInvoices } from "@/api/hooks";

function downloadDocument(invoice: Invoice, kind: "invoice" | "receipt") {
  const title = kind === "receipt" ? "Payment receipt" : "Invoice";
  const paymentLine = invoice.status === "paid" ? `Paid on: ${invoice.paidAt}\nPayment method: ${invoice.paymentMethod}` : `Due on: ${invoice.dueAt}\nPayment status: Payment required`;
  const lines = invoice.lineItems.map((item) => `${item.label}${item.detail ? ` — ${item.detail}` : ""}: ${item.amount}`).join("\n");
  const body = `${title}\nNew World Cargo\n\nDocument number: ${invoice.invoiceNumber}\nIssued: ${invoice.issuedAt}\nCustomer: Amina\nShipment: ${invoice.shipmentLabel}\nRoute: ${invoice.route}\n\n${lines}\n\nTotal: ${invoice.amount}\n${paymentLine}\n\nThank you for choosing New World Cargo.`;
  const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${invoice.invoiceNumber.toLowerCase()}-${kind}.txt`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  feedback.success(`${title} downloaded.`);
}

function StatusChip({ status }: { status: InvoiceStatus }) {
  const paid = status === "paid";
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${paid ? "bg-cargo-yellow/20 text-ink" : "bg-cargo-yellow/20 text-ink"}`}><span className={`size-1.5 rounded-full ${paid ? "bg-cargo-yellow" : "bg-ink"}`} />{paid ? "Paid" : "Unpaid"}</span>;
}

function InvoiceRow({ invoice, onOpen }: { invoice: Invoice; onOpen: () => void }) {
  return <button onClick={onOpen} className="group flex w-full items-center gap-4 border-b border-ink/8 px-1 py-4 text-left transition hover:bg-ink/[0.025] sm:px-3">
    <div className={`grid size-11 shrink-0 place-items-center rounded-2xl ${invoice.status === "paid" ? "bg-cargo-yellow/20 text-ink" : "bg-cargo-yellow/20 text-ink"}`}><ReceiptText className="size-5" strokeWidth={1.8} /></div>
    <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-bold text-ink">{invoice.shipmentLabel}</p><StatusChip status={invoice.status} /></div><p className="mt-1 truncate text-xs text-ink/55">{invoice.invoiceNumber} · {invoice.issuedAt}</p></div>
    <div className="hidden text-right sm:block"><p className="text-sm font-extrabold text-ink">{invoice.amount}</p><p className="mt-1 text-xs text-ink/45">{invoice.status === "paid" ? `Paid ${invoice.paidAt}` : `Due ${invoice.dueAt}`}</p></div>
    <ChevronRight className="size-4 shrink-0 text-ink/35 transition group-hover:translate-x-0.5 group-hover:text-ink" />
  </button>;
}

function InvoiceDetail({ invoice, onClose, onPay }: { invoice: Invoice; onClose: () => void; onPay: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/35 p-3 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-label={`${invoice.invoiceNumber} details`}>
    <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[28px] border border-ink/10 bg-white p-5 shadow-2xl sm:p-7">
      <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-ink/45">Invoice details</p><h2 className="mt-2 font-heading text-2xl font-extrabold tracking-tight text-ink">{invoice.invoiceNumber}</h2></div><button onClick={onClose} className="grid size-9 place-items-center rounded-full border border-ink/10 text-ink/50 transition hover:bg-ink/5 hover:text-ink" aria-label="Close invoice details"><X className="size-4" /></button></div>
      <div className="mt-6 rounded-2xl bg-[#f7f8fa] p-4"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-cargo-yellow text-ink"><Package className="size-5" strokeWidth={1.8} /></span><div className="min-w-0"><p className="text-sm font-bold text-ink">{invoice.shipmentLabel}</p><p className="mt-1 text-xs leading-5 text-ink/55">{invoice.route}</p></div></div><StatusChip status={invoice.status} /></div><div className="mt-4 grid grid-cols-2 gap-4 border-t border-ink/8 pt-4"><div><p className="text-[11px] font-semibold text-ink/45">Issued</p><p className="mt-1 text-sm font-bold text-ink">{invoice.issuedAt}</p></div><div><p className="text-[11px] font-semibold text-ink/45">{invoice.status === "paid" ? "Paid on" : "Due on"}</p><p className="mt-1 text-sm font-bold text-ink">{invoice.status === "paid" ? invoice.paidAt : invoice.dueAt}</p></div></div></div>
      <div className="mt-6"><p className="text-xs font-bold uppercase tracking-[0.16em] text-ink/45">Charges</p><div className="mt-3 divide-y divide-ink/8">{invoice.lineItems.map((item) => <div key={item.label} className="flex items-start justify-between gap-4 py-3"><div><p className="text-sm font-semibold text-ink">{item.label}</p>{item.detail && <p className="mt-1 text-xs text-ink/45">{item.detail}</p>}</div><p className="text-sm font-bold text-ink">{item.amount}</p></div>)}</div><div className="mt-2 flex items-center justify-between border-t border-ink/15 pt-4"><p className="text-sm font-bold text-ink">Total</p><p className="font-heading text-xl font-extrabold text-ink">{invoice.amount}</p></div></div>
      {invoice.status === "paid" && <div className="mt-5 flex items-start gap-3 rounded-2xl bg-cargo-yellow/15 p-4 text-ink"><Check className="mt-0.5 size-4 shrink-0" /><div><p className="text-sm font-bold">Payment received</p><p className="mt-1 text-xs leading-5 text-ink/70">{invoice.paymentMethod}. Your receipt is ready to download.</p></div></div>}
      {invoice.status === "unpaid" && <div className="mt-5 flex items-start gap-3 rounded-2xl bg-cargo-yellow/15 p-4 text-ink"><CircleAlert className="mt-0.5 size-4 shrink-0" /><div><p className="text-sm font-bold">Payment still due</p><p className="mt-1 text-xs leading-5 text-ink/70">Review this invoice and pay from your wallet when you are ready.</p></div></div>}
      <div className="mt-6 grid gap-3 sm:grid-cols-2"><button onClick={() => downloadDocument(invoice, "invoice")} className="flex items-center justify-center gap-2 rounded-2xl border border-ink/15 px-4 py-3 text-sm font-bold text-ink transition hover:bg-ink/5"><FileText className="size-4" /> Download invoice</button>{invoice.status === "paid" ? <button onClick={() => downloadDocument(invoice, "receipt")} className="flex items-center justify-center gap-2 rounded-2xl bg-cargo-yellow px-4 py-3 text-sm font-bold text-ink transition hover:brightness-105"><Download className="size-4" /> Download receipt</button> : <button onClick={onPay} className="flex items-center justify-center gap-2 rounded-2xl bg-cargo-yellow px-4 py-3 text-sm font-bold text-ink transition hover:brightness-105">Pay invoice <ArrowUpRight className="size-4" /></button>}</div>
    </div>
  </div>;
}

export default function Invoices() {
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState<"all" | InvoiceStatus>("all");
  const [query, setQuery] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [paidMethods, setPaidMethods] = useState<Record<string, string>>({});
  const { data: invoices = [], isLoading, isError, refetch } = useCustomerInvoices({ query, status: filter });
  const ledger = useMemo(() => invoices.map((invoice) => paidMethods[invoice.id] ? { ...invoice, status: "paid" as const, paidAt: "Just now", paymentMethod: paidMethods[invoice.id] } : invoice), [paidMethods]);
  const matching = useMemo(() => ledger.filter((invoice) => filter === "all" || invoice.status === filter), [filter, ledger]);
  const recent = matching.slice(0, 3);
  const older = matching.slice(3);
  const unpaidTotal = ledger.filter((invoice) => invoice.status === "unpaid").reduce((total, invoice) => total + invoice.amountValue, 0);
  const completePayment = (payment: PaymentConfirmation) => {
    if (!paymentInvoice) return;
    setPaidMethods((current) => ({ ...current, [paymentInvoice.id]: payment.label }));
    setSelectedInvoice((current) => current?.id === paymentInvoice.id ? { ...current, status: "paid", paidAt: "Just now", paymentMethod: payment.label } : current);
    setPaymentInvoice(null);
    feedback.success("Payment received. Your receipt is ready to download.");
  };

  return <div className="mx-auto max-w-5xl text-ink">
    <button onClick={() => navigate("/")} className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-ink/55 transition hover:text-ink"><ArrowLeft className="size-4" /> Back home</button>
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-ink/45">Payments</p><h1 className="mt-2 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">Invoices & billing</h1><p className="mt-2 max-w-xl text-sm leading-6 text-ink/55">Keep every cargo charge, payment, and receipt in one place.</p></div><div className="rounded-2xl bg-cargo-yellow/20 px-4 py-3 sm:min-w-44"><p className="text-[11px] font-semibold text-ink/65">Outstanding balance</p><p className="mt-1 font-heading text-xl font-extrabold text-ink">K {unpaidTotal.toLocaleString()}</p></div></div>
    <div className="mt-7 grid gap-3 sm:grid-cols-[1fr_auto]"><label className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-white px-4"><Search className="size-4 text-ink/40" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search invoice or shipment" className="h-12 min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink/35" /></label><div className="flex gap-1 rounded-2xl bg-ink/[0.05] p-1">{(["all", "unpaid", "paid"] as const).map((option) => <button key={option} onClick={() => setFilter(option)} className={`rounded-xl px-4 py-2.5 text-xs font-bold capitalize transition ${filter === option ? "bg-white text-ink shadow-sm" : "text-ink/45 hover:text-ink"}`}>{option}</button>)}</div></div>
    <section className="mt-9"><div className="flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-ink/40">Latest</p><h2 className="mt-2 font-heading text-xl font-extrabold">Recent invoices</h2></div><p className="text-xs font-semibold text-ink/40">{recent.length} shown</p></div><div className="mt-4 rounded-[24px] border border-ink/10 bg-white px-3 sm:px-4">{isLoading ? <div className="p-8 text-center text-sm text-ink/50">Loading invoices linked to your account…</div> : isError ? <div className="p-8 text-center"><p className="text-sm text-ink/60">We could not load your invoices.</p><button onClick={() => refetch()} className="mt-3 text-sm font-bold text-ink">Try again</button></div> : recent.length ? recent.map((invoice) => <InvoiceRow key={invoice.id} invoice={invoice} onOpen={() => setSelectedInvoice(invoice)} />) : <div className="p-8 text-center text-sm text-ink/50">No invoices match your search.</div>}</div></section>
    {older.length > 0 && <section className="mt-9"><div className="flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-ink/40">Archive</p><h2 className="mt-2 font-heading text-xl font-extrabold">Older invoices</h2></div><CalendarDays className="size-5 text-ink/35" /></div><div className="mt-4 rounded-[24px] border border-ink/10 bg-white px-3 sm:px-4">{older.map((invoice) => <InvoiceRow key={invoice.id} invoice={invoice} onOpen={() => setSelectedInvoice(invoice)} />)}</div></section>}
    <div className="mt-8 flex items-start gap-3 rounded-2xl border border-ink/10 bg-white p-4 text-ink/55"><ArrowDownToLine className="mt-0.5 size-4 shrink-0 text-ink/45" /><p className="text-xs leading-5">Open any invoice to download a copy. Paid invoices also include a receipt for your records.</p></div>
    {selectedInvoice && <InvoiceDetail invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} onPay={() => setPaymentInvoice(selectedInvoice)} />}
    <PaymentModal open={Boolean(paymentInvoice)} invoiceId={paymentInvoice?.id} amount={paymentInvoice?.amount ?? ""} reference={paymentInvoice?.invoiceNumber ?? ""} onClose={() => setPaymentInvoice(null)} onSuccess={completePayment} />
  </div>;
}
