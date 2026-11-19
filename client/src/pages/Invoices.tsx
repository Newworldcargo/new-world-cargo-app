import { PaymentBreadcrumb } from "@/components/payment-breadcrumb";
import { ContentSkeleton, RefreshProgress } from "@/components/loading-skeleton";
// New World Cargo billing style: white operational workspace, Poppins hierarchy, navy ink, Cargo Yellow actions, restrained borders, mobile-first layout.

import { ArrowDownToLine, ArrowUpRight, CalendarDays, Check, ChevronRight, CircleAlert, Download, FileText, Package, ReceiptText, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import type { Invoice, InvoiceStatus } from "@/lib/domain";
import { PaymentModal, type PaymentConfirmation } from "@/components/payment-modal";
import { feedback } from "@/lib/feedback";
import { useCustomerInvoices } from "@/api/hooks";
import { useAuth } from "@/contexts/AuthContext";
import { paymentControlClass, paymentPageClass, paymentSurfaceClass, primaryPaymentAction, secondaryPaymentAction } from "@/lib/payment-presentation";

function downloadDocument(invoice: Invoice, customerName: string) {
  const title = "Invoice";
  const paymentLine = invoice.status === "paid" ? `Paid on: ${invoice.paidAt}\nPayment method: ${invoice.paymentMethod}` : `Due on: ${invoice.dueAt}\nPayment status: Payment required`;
  const lines = invoice.lineItems.map((item) => `${item.label}${item.detail ? ` — ${item.detail}` : ""}: ${item.amount}`).join("\n");
  const body = `${title}\nNew World Cargo\n\nDocument number: ${invoice.invoiceNumber}\nIssued: ${invoice.issuedAt}\nCustomer: ${customerName}\nShipment: ${invoice.shipmentLabel}\nRoute: ${invoice.route}\n\n${lines}\n\nTotal: ${invoice.amount}\n${paymentLine}\n\nThank you for choosing New World Cargo.`;
  const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${invoice.invoiceNumber.toLowerCase()}-invoice.txt`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  feedback.success(`${title} downloaded.`);
}

function StatusChip({ status }: { status: InvoiceStatus }) {
  const paid = status === "paid";
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${paid ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"}`}>
    <span className={`size-1.5 rounded-full ${paid ? "bg-emerald-700" : "bg-amber-700"}`} aria-hidden="true" />{paid ? "Paid" : "Unpaid"}
  </span>;
}

function InvoiceRow({ invoice, onOpen }: { invoice: Invoice; onOpen: () => void }) {
  return <button onClick={onOpen} className="group flex w-full items-center gap-3 rounded-xl px-2 py-3.5 text-left transition-colors hover:bg-[#f2f6fa] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#012642] sm:gap-4 sm:px-3">
    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#eaf2f8] text-ink"><ReceiptText className="size-5" strokeWidth={1.8} /></div>
    <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-bold text-ink">{invoice.shipmentLabel}</p><StatusChip status={invoice.status} /></div><p className="mt-1 truncate text-xs text-ink/55">{invoice.invoiceNumber} · {invoice.issuedAt}</p></div>
    <div className="hidden text-right sm:block"><p className="text-sm font-extrabold text-ink">{invoice.amount}</p><p className="mt-1 text-xs text-ink/45">{invoice.status === "paid" ? `Paid ${invoice.paidAt}` : `Due ${invoice.dueAt}`}</p></div>
    <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-[#dce6ee] bg-[#f2f6fa] text-ink group-hover:bg-[#e5eef5]">
      <ChevronRight className="size-4" aria-hidden="true" />
    </span>
  </button>;
}

function InvoiceDetail({ invoice, customerName, onClose, onPay }: { invoice: Invoice; customerName: string; onClose: () => void; onPay: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/35 p-3 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-label={`${invoice.invoiceNumber} details`}>
    <div className={paymentSurfaceClass + " max-h-[90dvh] w-full max-w-xl overflow-y-auto p-5 sm:p-7"}>
      <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-ink/45">Invoice details</p><h2 className="mt-2 font-heading text-2xl font-extrabold tracking-tight text-ink">{invoice.invoiceNumber}</h2></div><button onClick={onClose} className={secondaryPaymentAction + " size-11 min-h-11 shrink-0 px-0"} aria-label="Close invoice details"><X className="size-4" /></button></div>
      <div className="mt-6 rounded-2xl bg-[#f7f8fa] p-4"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-cargo-yellow text-ink"><Package className="size-5" strokeWidth={1.8} /></span><div className="min-w-0"><p className="text-sm font-bold text-ink">{invoice.shipmentLabel}</p><p className="mt-1 text-xs leading-5 text-ink/55">{invoice.route}</p></div></div><StatusChip status={invoice.status} /></div><div className="mt-4 grid grid-cols-2 gap-4 border-t border-ink/8 pt-4"><div><p className="text-[11px] font-semibold text-ink/45">Issued</p><p className="mt-1 text-sm font-bold text-ink">{invoice.issuedAt}</p></div><div><p className="text-[11px] font-semibold text-ink/45">{invoice.status === "paid" ? "Paid on" : "Due on"}</p><p className="mt-1 text-sm font-bold text-ink">{invoice.status === "paid" ? invoice.paidAt : invoice.dueAt}</p></div></div></div>
      <div className="mt-6"><p className="text-xs font-bold uppercase tracking-[0.16em] text-ink/45">Charges</p><div className="mt-3 divide-y divide-ink/8">{invoice.lineItems.map((item) => <div key={item.label} className="flex items-start justify-between gap-4 py-3"><div><p className="text-sm font-semibold text-ink">{item.label}</p>{item.detail && <p className="mt-1 text-xs text-ink/45">{item.detail}</p>}</div><p className="text-sm font-bold text-ink">{item.amount}</p></div>)}</div><div className="mt-2 flex items-center justify-between border-t border-ink/15 pt-4"><p className="text-sm font-bold text-ink">Total</p><p className="font-heading text-xl font-extrabold text-ink">{invoice.amount}</p></div></div>
      {invoice.status === "paid" && <div className="mt-5 flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-900"><Check className="mt-0.5 size-4 shrink-0" /><div><p className="text-sm font-bold">Payment received</p><p className="mt-1 text-xs leading-5 text-ink/70">{invoice.paymentMethod}. Your receipt is ready to download.</p></div></div>}
      {invoice.status === "unpaid" && <div className="mt-5 flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-amber-900"><CircleAlert className="mt-0.5 size-4 shrink-0" /><div><p className="text-sm font-bold">Payment still due</p><p className="mt-1 text-xs leading-5 text-ink/70">Review this invoice and choose an available payment method when you are ready.</p></div></div>}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button onClick={() => downloadDocument(invoice, customerName)} className={secondaryPaymentAction}><FileText className="size-4" aria-hidden="true" /> Download invoice</button>
        {invoice.status === "paid" ? invoice.shipmentId
          ? <a href={`/shipments/${encodeURIComponent(invoice.shipmentId)}#payments`} className={primaryPaymentAction}><Download className="size-4" aria-hidden="true" /> View receipts</a>
          : <p className="text-sm">Contact your branch for this receipt.</p>
          : <button onClick={onPay} className={primaryPaymentAction}>Pay invoice <ArrowUpRight className="size-4" aria-hidden="true" /></button>}
      </div>
    </div>
  </div>;
}

export default function Invoices() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const customerName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Customer";
  const [filter, setFilter] = useState<"all" | InvoiceStatus>("all");
  const [query, setQuery] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const { data, isLoading, isFetching, isError, refetch } = useCustomerInvoices({ query, status: filter });
  const invoices = data ?? [];
  const ledger = invoices;
  const matching = useMemo(() => ledger.filter((invoice) => filter === "all" || invoice.status === filter), [filter, ledger]);
  const recent = matching.slice(0, 3);
  const older = matching.slice(3);
  const unpaidTotals = ledger.filter(invoice => invoice.status === "unpaid").reduce<Record<string, number>>((totals, invoice) => {
    totals[invoice.currency] = (totals[invoice.currency] ?? 0) + Math.round(invoice.amountValue * 100);
    return totals;
  }, {});
  const completePayment = (_payment: PaymentConfirmation) => {
    if (!paymentInvoice) return;
    setSelectedInvoice(null);
    setPaymentInvoice(null);
    void refetch();
    feedback.success("Payment received. Your receipt is ready to download.");
    if (paymentInvoice.shipmentId) navigate(`/shipments/${encodeURIComponent(paymentInvoice.shipmentId)}#payments`);
  };

  return <div data-payments-page className={paymentPageClass}>
    <PaymentBreadcrumb current="Invoices" />
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="font-heading text-3xl font-extrabold sm:text-4xl">Invoices &amp; billing</h1>
        <p className="mt-2 text-sm text-ink/75">View cargo charges, payments, and receipts.</p>
      </div>
      <div className="rounded-2xl border border-[#dce6ee] bg-[#f2f6fa] px-4 py-3 sm:min-w-48">
        <p className="text-xs font-medium text-ink/75">Outstanding balance</p>
        <div className="mt-1 font-heading text-xl font-extrabold tabular-nums">
          {Object.entries(unpaidTotals).map(([currency, minor]) => <p key={currency}>{currency} {(minor / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>)}
          {!Object.keys(unpaidTotals).length && "No unpaid invoices"}
        </div>
      </div>
    </header>
    <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
      <label className={paymentControlClass + " flex items-center gap-3 px-4 focus-within:border-[#012642]"}>
        <Search className="size-4 shrink-0 text-ink/65" aria-hidden="true" />
        <input aria-label="Search invoice or shipment" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search invoice or shipment" className="h-11 min-w-0 flex-1 bg-transparent text-base outline-none sm:text-sm" />
      </label>
      <div role="group" aria-label="Invoice status" className="flex gap-1 rounded-xl border border-[#dce6ee] bg-[#f2f6fa] p-1">
        {(["all", "unpaid", "paid"] as const).map(option =>
          <button key={option} type="button" aria-pressed={filter === option} onClick={() => setFilter(option)} className={`min-h-10 flex-1 rounded-lg px-3 text-xs font-medium capitalize transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#012642] sm:px-4 ${filter === option ? "bg-[#012642] text-[#fff]!" : "text-ink hover:bg-[#e5eef5]"}`}>{option}</button>
        )}
      </div>
    </div>
    <section className={paymentSurfaceClass + " mt-5 p-4 sm:p-5"}>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-bold">Recent invoices</h2>
        {isFetching && data ? <RefreshProgress label="Refreshing invoices" /> : !isLoading && !isError && <p className="text-xs text-ink/75">{recent.length} shown</p>}
      </div>
      {isLoading ? <ContentSkeleton label="Loading invoices" /> : isError && !data ? <div className="py-6 text-center">
        <p role="status" className="mb-3 text-sm text-ink/75">We could not load your invoices.</p>
        <button className={secondaryPaymentAction} onClick={() => void refetch()}>Try again</button>
      </div> : recent.length ? <ul className="divide-y divide-[#e2ebf2]">
        {recent.map(invoice => <li key={invoice.id}><InvoiceRow invoice={invoice} onOpen={() => setSelectedInvoice(invoice)} /></li>)}
      </ul> : <p className="px-2 py-6 text-sm text-ink/75">No invoices match your search.</p>}
    </section>
    {older.length > 0 && <section className={paymentSurfaceClass + " mt-5 p-4 sm:p-5"}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-xl font-bold">Older invoices</h2><CalendarDays className="size-5 text-ink/65" aria-hidden="true" />
      </div>
      <ul className="divide-y divide-[#e2ebf2]">
        {older.map(invoice => <li key={invoice.id}><InvoiceRow invoice={invoice} onOpen={() => setSelectedInvoice(invoice)} /></li>)}
      </ul>
    </section>}
    <p className="mt-5 flex items-start gap-2 text-xs text-ink/75"><ArrowDownToLine className="size-4 shrink-0" aria-hidden="true" /> Open a paid invoice to find its receipt.</p>
    {selectedInvoice && <InvoiceDetail invoice={selectedInvoice} customerName={customerName} onClose={() => setSelectedInvoice(null)} onPay={() => setPaymentInvoice(selectedInvoice)} />}
    <PaymentModal open={Boolean(paymentInvoice)} invoiceId={paymentInvoice?.id} amount={paymentInvoice?.amount ?? ""} reference={paymentInvoice?.invoiceNumber ?? ""} onClose={() => setPaymentInvoice(null)} onSuccess={completePayment} actionClassName={primaryPaymentAction + " w-full"} />
  </div>;
}
