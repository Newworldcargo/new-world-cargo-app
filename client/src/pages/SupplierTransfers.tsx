import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest } from "@/api/http";
import { CustomerApiError } from "@/api/errors";
import { ContentSkeleton } from "@/components/loading-skeleton";
import { PaymentBreadcrumb } from "@/components/payment-breadcrumb";
import { StatusBadge, supplierMethodLabels, type SupplierPaymentRecord } from "@/components/supplier-payment-record";
import { useAuth } from "@/contexts/AuthContext";
import { supplierDetailsPath } from "@/lib/payment-routes";
import SupplierPayments from "./SupplierPayments";

const money = new Intl.NumberFormat("en-ZM", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const date = new Intl.DateTimeFormat("en-ZM", { dateStyle: "medium", timeZone: "Africa/Lusaka" });

function paymentDate(value?: string) {
  return value && !Number.isNaN(Date.parse(value)) ? date.format(new Date(value)) : null;
}

function paymentAmount(record: SupplierPaymentRecord) {
  return `${record.currency} ${money.format(Number(record.amount))}`;
}

const statusOptions = [
  { value: "all", label: "All statuses" },
  { value: "under_review", label: "Under review" },
  { value: "pending_confirmation", label: "Pending confirmation" },
  { value: "paid", label: "Paid" },
] as const;

const card = "rounded-3xl border border-ink/10 bg-white p-4 shadow-sm sm:p-6";

export default function SupplierTransfers({ reference }: { reference?: string }) {
  const { user } = useAuth();
  const [status, setStatus] = useState("all");
  const transfersSection = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!reference && window.location.hash === "#transfers") {
      transfersSection.current?.scrollIntoView({ block: "start" });
    }
  }, [reference]);
  const transfers = useQuery({
    queryKey: ["customer", user?.id, "supplier-payment-requests"],
    queryFn: () => apiRequest<SupplierPaymentRecord[]>("/supplier-payment-requests"),
    enabled: Boolean(user?.id) && !reference,
  });
  const details = useQuery({
    queryKey: ["customer", user?.id, "supplier-payment-requests", reference],
    queryFn: () => apiRequest<SupplierPaymentRecord>(`/supplier-payment-requests/${encodeURIComponent(reference ?? "")}`),
    enabled: Boolean(user?.id && reference),
    retry: false,
  });

  if (reference) {
    const record = details.data;
    const missing = details.error instanceof CustomerApiError && details.error.status === 404;
    return <div className="mx-auto max-w-3xl text-ink sm:py-4">
      <PaymentBreadcrumb current="Details" supplierChild />
      <h1 className="text-2xl font-bold sm:text-3xl">{record?.status === "under_review" ? "Quote request" : "Supplier payment details"}</h1>
      <div className={card + " mt-5"}>
        {details.isPending ? <ContentSkeleton label="Loading supplier payment" /> : details.isError ? <>
          <p role="status" className="text-sm text-ink/75">{missing ? "We couldn’t find this supplier payment." : "We couldn’t load this supplier payment."}</p>
          {!missing && <button type="button" className="mt-3 min-h-11 font-semibold underline" onClick={() => void details.refetch()}>Try again</button>}
        </> : record && <>
          <header className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-lg font-bold">{record.reference}</p>
            <StatusBadge status={record.status} />
          </header>
          <div className="mt-4 rounded-2xl bg-[#edf3f6] p-4">
            <p className="text-sm text-ink/75">{record.status === "under_review" ? "Requested amount" : "Total funds"}</p>
            <p className="mt-1 break-words text-2xl font-bold tabular-nums">{paymentAmount(record)}</p>
          </div>
          <dl className="mt-3 divide-y divide-ink/10 text-sm">
            {[
              ["Supplier", record.supplierName], ["Route", record.route], ["Receiving currency", record.receivingCurrency],
              ["Supplier invoice", record.invoiceReference], ["Supplier email", record.supplierEmail],
              ["Payment method", record.paymentMethod && supplierMethodLabels[record.paymentMethod]],
              ["Date", paymentDate(record.createdAt)],
            ].filter(([, value]) => value).map(([label, value]) => <div key={label} className="grid grid-cols-2 gap-3 py-3">
              <dt className="text-ink/75">{label}</dt><dd className="break-words text-right font-semibold">{value}</dd>
            </div>)}
          </dl>
          {record.status === "under_review" && <p className="mt-3 text-sm text-ink/75">We’ll contact you with your confirmed quote and payment instructions.</p>}
        </>}
      </div>
    </div>;
  }

  const visibleTransfers = transfers.data?.filter(record => status === "all" || record.status === status) ?? [];

  return <div className="mx-auto max-w-5xl text-ink sm:py-4">
    <SupplierPayments dashboard />
    <section id="transfers" ref={transfersSection} className={card + " mt-7 scroll-mt-24"} aria-labelledby="transfers-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="transfers-heading" className="text-xl font-bold">Recent transfers</h2>
          <p className="mt-1 text-sm text-ink/75">Payment requests and transfers</p>
        </div>
        <select aria-label="Filter transfers by status" value={status} onChange={event => setStatus(event.target.value)} className="min-h-11 max-w-full rounded-xl border border-ink/20 bg-white px-3 text-sm font-medium text-ink">
          {statusOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </div>
      {transfers.isPending ? <ContentSkeleton label="Loading transfers" /> : transfers.isError ? <>
        <p role="status" className="mt-4 text-sm text-ink/75">We couldn’t load your transfers.</p>
        <button type="button" className="mt-2 min-h-11 font-semibold underline" onClick={() => void transfers.refetch()}>Try again</button>
      </> : visibleTransfers.length ? <>
        <div aria-hidden="true" className="mt-5 hidden grid-cols-[minmax(0,1fr)_minmax(0,.8fr)_minmax(0,.65fr)_10rem] gap-3 border-b border-ink/10 px-2 pb-2 text-xs font-semibold text-ink/70 sm:grid">
          <span>Supplier</span><span>Route</span><span className="text-right">Amount</span><span className="text-right">Status</span>
        </div>
        <ul className="mt-3 divide-y divide-ink/10 sm:mt-0">
        {visibleTransfers.map(record => <li key={record.reference}>
          <Link aria-label={`View ${record.reference} for ${record.supplierName}`} href={supplierDetailsPath(record.reference)} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 rounded-xl px-2 py-4 hover:bg-ink/5 sm:grid-cols-[minmax(0,1fr)_minmax(0,.8fr)_minmax(0,.65fr)_10rem]">
            <div className="min-w-0">
              <p className="break-words font-bold">{record.supplierName}</p>
              <p className="text-xs text-ink/75">{record.reference}</p>
            </div>
            <div className="col-start-1 row-start-2 text-xs text-ink/75 sm:col-start-auto sm:row-start-auto">
              <p>{record.route}{record.receivingCurrency ? ` · ${record.receivingCurrency}` : ""}</p>
              {paymentDate(record.createdAt) && <time dateTime={record.createdAt}>{paymentDate(record.createdAt)}</time>}
              {record.paymentMethod && <p>{supplierMethodLabels[record.paymentMethod]}</p>}
            </div>
            <div className="col-start-2 row-start-1 text-right sm:col-start-auto sm:row-start-auto">
              <p className="text-sm font-bold tabular-nums">{paymentAmount(record)}</p>
              <p className="text-xs text-ink/75">{record.status === "under_review" ? "Requested amount" : "Total funds"}</p>
            </div>
            <span className="col-start-2 row-start-2 flex items-center justify-end gap-2 sm:col-start-auto sm:row-start-auto">
              <StatusBadge status={record.status} /><ArrowRight className="hidden size-4 text-ink/65 sm:block" aria-hidden="true" />
            </span>
          </Link>
        </li>)}
      </ul></> : <p role="status" className="mt-4 rounded-xl bg-[#f3f6f8] p-4 text-sm text-ink/75">{status === "all" ? "Your quote requests and transfers will appear here." : "No recent transfers match this status."}</p>}
    </section>
  </div>;
}
