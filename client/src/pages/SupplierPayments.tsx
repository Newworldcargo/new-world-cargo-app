import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowDown, ArrowRight, ArrowUpRight, CheckCircle2, ChevronDown, Clock3, FileText, History, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/api/http";
import { CustomerApiError } from "@/api/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { clearSupplierForm, clearSupplierPaymentDraft, clearSupplierPaymentReturn, isSupplierAmount, readSupplierForm, readSupplierPaymentDraft, rememberSupplierForm, supplierCurrencies, supplierCurrencyForRoute } from "@/lib/supplier-payment-draft";

type PaymentRequest = { reference: string; supplierName: string; route: string; currency: string; amount: string; receivingCurrency?: string; createdAt?: string; status: "under_review" | "pending_confirmation" | "paid" };

const selectClass = "h-12 w-full rounded-xl border border-ink/15 bg-white px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const inputClass = "h-12 rounded-xl border-ink/15 text-base";
const primaryClass = "h-12 rounded-xl bg-cargo-yellow px-6 font-bold text-ink hover:bg-cargo-yellow/90";
const panel = "min-w-0 rounded-2xl border border-ink/10 bg-white p-5 shadow-sm sm:p-7";
const field = "grid min-w-0 gap-1.5 text-sm font-semibold";
const money = new Intl.NumberFormat("en-ZM", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const date = new Intl.DateTimeFormat("en-ZM", { dateStyle: "medium", timeZone: "Africa/Lusaka" });
const flags: Record<string, string> = { ZMW: "🇿🇲", USD: "🇺🇸", CNY: "🇨🇳", AED: "🇦🇪", EUR: "🇪🇺", GBP: "🇬🇧", ZAR: "🇿🇦" };
const statuses = {
  under_review: { label: "Under review", style: "bg-amber-50 text-amber-900" },
  pending_confirmation: { label: "Pending confirmation", style: "bg-sky-50 text-sky-900" },
  paid: { label: "Paid", style: "bg-emerald-50 text-emerald-900" },
};
const emptySupplier = { supplier_name: "", supplier_email: "", invoice_reference: "", notes: "" };

async function fetchRates(signal: AbortSignal) {
  const response = await fetch("https://admin.newworldcargo.com/api/fcp/rate", { signal, cache: "no-store", credentials: "omit" });
  if (!response.ok) throw new Error("Rates unavailable");
  const data = await response.json();
  if (!Number.isInteger(data?.fee_bps) || data.fee_bps < 0 || data.fee_bps > 10000 || !data.rates || typeof data.rates !== "object") {
    throw new Error("Rates unavailable");
  }
  return { feeBps: data.fee_bps as number, rates: data.rates as Record<string, Record<string, unknown>> };
}

function estimateAmounts(amount: string, rate: unknown, feeBps: number | undefined) {
  if (!isSupplierAmount(amount)) return { receives: null, fee: null, total: null };
  const [whole, decimals = ""] = amount.split(".");
  const minor = BigInt(whole) * BigInt(100) + BigInt(decimals.padEnd(2, "0"));
  const fee = feeBps === undefined ? null : (minor * BigInt(feeBps) + BigInt(5000)) / BigInt(10000);
  const receives = typeof rate === "string"
    ? (minor * BigInt(rate.replace(".", "")) + BigInt(500000000000)) / BigInt(1000000000000)
    : null;
  return { receives, fee, total: fee === null ? null : minor + fee };
}

function formatMinor(minor: bigint) {
  return money.format(minor / BigInt(100)).replace(/\.00$/, "." + (minor % BigInt(100)).toString().padStart(2, "0"));
}

function CurrencyPicker({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <div className="relative flex shrink-0 items-center rounded-xl bg-[#012642] text-[#fff]">
    <span aria-hidden="true" className="pointer-events-none absolute left-2.5 text-base sm:left-3">{flags[value]}</span>
    <select aria-label={label} value={value} onChange={event => onChange(event.target.value)} className="h-11 cursor-pointer appearance-none rounded-xl bg-transparent pl-9 pr-7 text-sm font-bold text-[#fff]! focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink sm:pl-10 sm:pr-8">
      {supplierCurrencies.map(code => <option className="bg-white text-ink" key={code}>{code}</option>)}
    </select>
    <ChevronDown className="pointer-events-none absolute right-2 size-3.5 sm:right-3" aria-hidden="true" />
  </div>;
}

function SummaryRows({ rows }: { rows: string[][] }) {
  return <dl className="divide-y divide-ink/10">
    {rows.filter(([, value]) => value).map(([label, value]) => <div key={label} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] gap-3 py-3 text-sm">
      <dt className="text-ink/70">{label}</dt><dd className="whitespace-pre-wrap break-words text-right font-semibold">{value}</dd>
    </div>)}
  </dl>;
}

export default function SupplierPayments() {
  const { user } = useAuth();
  const [estimate] = useState(readSupplierPaymentDraft);
  const [savedForm] = useState(() => readSupplierForm(user?.id));
  const [payment, setPayment] = useState(savedForm?.payment ?? {
    amount: estimate.amount, currency: estimate.currency,
    supplier_currency: estimate.supplier_currency, route: estimate.route,
  });
  const [supplier, setSupplier] = useState(savedForm?.supplier ?? emptySupplier);
  const [step, setStep] = useState<"details" | "review">(savedForm?.locked ? "review" : "details");
  const [result, setResult] = useState<PaymentRequest | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [locked, setLocked] = useState(savedForm?.locked ?? false);
  const inFlight = useRef(false);
  const submission = useRef(savedForm?.submissionKey ?? "");
  const heading = useRef<HTMLHeadingElement>(null);
  const requests = useQuery({
    queryKey: ["customer", user?.id, "supplier-payment-requests"],
    queryFn: () => apiRequest<PaymentRequest[]>("/supplier-payment-requests"),
    enabled: Boolean(user?.id),
  });
  const rates = useQuery({ queryKey: ["supplier-payment-rates"], queryFn: ({ signal }) => fetchRates(signal), staleTime: 60_000, retry: false });
  const candidate = rates.data?.rates[payment.currency]?.[payment.supplier_currency];
  const rate = !rates.isError && typeof candidate === "string" && /^\d{1,12}\.\d{12}$/.test(candidate) && Number(candidate) > 0 ? candidate : null;
  const feeBps = rates.isError ? undefined : rates.data?.feeBps;
  const { receives, fee, total } = estimateAmounts(payment.amount, rate, feeBps);
  const sameEstimate = Object.entries(payment).every(([key, value]) => value === estimate[key as keyof typeof payment]);

  const receivingAmount = receives !== null ? formatMinor(receives) : !rates.isSuccess && sameEstimate && estimate.receives ? estimate.receives : null;
  const feeLabel = feeBps === undefined ? "Handling fee" : `Handling fee (${feeBps / 100}%)`;
  const transfers = requests.data ?? [];
  const history = result && !transfers.some(transfer => transfer.reference === result.reference) ? [result, ...transfers] : transfers;

  useEffect(clearSupplierPaymentReturn, []);
  useEffect(() => {
    if (user?.id && !result) rememberSupplierForm(user.id, { payment, supplier, submissionKey: submission.current, locked });
  }, [user?.id, result, payment, supplier, locked]);

  function selectRoute(route: string) {
    setPayment(current => ({ ...current, route, supplier_currency: supplierCurrencyForRoute(route) }));
  }

  function review(event: FormEvent) {
    event.preventDefault();
    if (!isSupplierAmount(payment.amount) || !supplier.supplier_name.trim() || !supplier.invoice_reference.trim()) {
      setError("Enter a valid amount, supplier name and invoice reference.");
      return;
    }
    setError("");
    setStep("review");
    requestAnimationFrame(() => heading.current?.focus());
  }

  async function submit() {
    if (inFlight.current) return;
    inFlight.current = true;
    setSubmitting(true);
    setError("");
    try {
      submission.current ||= crypto.randomUUID();
      if (user?.id) rememberSupplierForm(user.id, { payment, supplier, submissionKey: submission.current, locked: true });
      const response = await apiRequest<PaymentRequest>("/supplier-payment-requests", {
        method: "POST",
        body: { ...payment, ...supplier, submission_key: submission.current },
      });
      clearSupplierPaymentDraft();
      clearSupplierForm();
      setResult(response);
      void requests.refetch();
      requestAnimationFrame(() => heading.current?.focus());
    } catch (caught) {
      // An uncertain network result is retried with the same key and details.
      const rejected = caught instanceof CustomerApiError && caught.status === 422;
      setLocked(!rejected);
      setError(caught instanceof CustomerApiError
        ? Object.values(caught.fieldErrors || {})[0]?.[0] || caught.message
        : "We could not confirm submission. Try again to check this request.");
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  function newRequest() {
    submission.current = "";
    setPayment({ amount: "", currency: payment.currency, supplier_currency: payment.supplier_currency, route: payment.route });
    setSupplier(emptySupplier);
    setResult(null);
    setLocked(false);
    setError("");
    setStep("details");
    requestAnimationFrame(() => heading.current?.focus());
  }

  return <div className="mx-auto max-w-6xl px-4 py-6 text-ink sm:px-8 sm:py-9">
    <header className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div>
        <h1 ref={heading} tabIndex={-1} className="text-3xl font-bold tracking-tight sm:text-4xl">
          {result ? "Request received" : step === "details" ? "Pay a supplier" : "Review your request"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink/70 sm:text-base">
          {result ? "We’ll contact you with your confirmed quote and payment instructions." : step === "details" ? "Estimate the cost and request a quote for your supplier invoice." : "Check the amount and supplier details before submitting."}
        </p>
      </div>
      <a href="#transfers" className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-bold hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-ink">View transfers <ArrowDown className="size-4" aria-hidden="true" /></a>
    </header>
    {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {result ? <section className={panel}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="size-8 shrink-0 text-emerald-700" aria-hidden="true" />
          <div><p className="font-bold">{result.reference}</p><p className="text-sm text-ink/70">Under review</p></div>
        </div>
        <Button className={primaryClass} onClick={newRequest}>New request <ArrowUpRight className="size-4" /></Button>
      </div>
    </section> : step === "details" ? <form onSubmit={review} className="grid gap-4 lg:grid-cols-2 lg:gap-6">
      <section className={panel} aria-labelledby="amount-heading">
        <h2 id="amount-heading" className="text-xl font-bold">Transfer amount</h2>
        <div className="mt-4 flex min-w-0 items-center gap-2 rounded-xl border border-ink/15 bg-[#f6f8fa] p-3 focus-within:border-ink/45 sm:gap-3">
          <label className="grid min-w-0 flex-1 gap-0.5 text-sm font-semibold text-ink/75">Amount to send
            <input required inputMode="decimal" maxLength={13} pattern="[0-9]{1,10}([.][0-9]{1,2})?" className="w-full min-w-0 rounded-sm bg-transparent text-xl font-bold tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink/75 md:text-2xl" placeholder="0.00" value={payment.amount} onChange={e => setPayment({ ...payment, amount: e.target.value })} />
          </label>
          <CurrencyPicker label="Sending currency" value={payment.currency} onChange={currency => setPayment({ ...payment, currency })} />
        </div>
        <div className="ml-5 flex min-h-9 items-center gap-2 border-l border-dashed border-ink/25 pl-3 text-xs font-medium text-ink/75" role="status">
          <span className="size-1.5 rounded-full bg-cargo-yellow" aria-hidden="true" />
          {rate ? `1 ${payment.currency} = ${Number(rate).toLocaleString("en-ZM", { maximumFractionDigits: 12 })} ${payment.supplier_currency}` : rates.isPending ? "Checking exchange rate…" : "Rate confirmed with your quote"}
        </div>
        <div className="flex min-w-0 items-center gap-2 rounded-xl border border-ink/15 bg-[#f6f8fa] p-3 sm:gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink/75" id="receiving-amount-label">Supplier receives</p>
            <output aria-labelledby="receiving-amount-label" className="block break-words text-xl font-bold tabular-nums sm:text-2xl">{receivingAmount ?? "—"}</output>
          </div>
          <CurrencyPicker label="Receiving currency" value={payment.supplier_currency} onChange={supplier_currency => setPayment({ ...payment, supplier_currency })} />
        </div>
        <label className={field + " mt-4"}>Payment route
          <select className={selectClass} value={payment.route} onChange={e => selectRoute(e.target.value)}><option>China</option><option>Dubai</option></select>
        </label>
        <dl className="mt-4 grid gap-2.5 text-sm">
          <div className="flex flex-wrap justify-between gap-x-3 gap-y-1"><dt className="text-ink/75">{feeLabel}</dt><dd className="font-semibold tabular-nums">{fee === null ? "Confirmed with quote" : `${payment.currency} ${formatMinor(fee)}`}</dd></div>
          <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 rounded-xl bg-cargo-yellow/20 px-3 py-3 font-bold"><dt>Estimated total</dt><dd className="tabular-nums">{total === null ? "—" : `${payment.currency} ${formatMinor(total)}`}</dd></div>
        </dl>
        <p className="mt-3 text-xs leading-relaxed text-ink/70">We’ll confirm the exchange rate and fee before you pay.</p>
      </section>
      <section className={panel + " flex flex-col"} aria-labelledby="supplier-heading">
        <h2 id="supplier-heading" className="flex items-center gap-2 text-xl font-bold"><FileText className="size-5" aria-hidden="true" /> Supplier details</h2>
        <div className="mt-4 grid flex-1 content-start gap-4">
          <label className={field}>Supplier or company name
            <Input required maxLength={160} autoComplete="off" className={inputClass} placeholder="e.g. Qingdao Industrial Supply" value={supplier.supplier_name} onChange={e => setSupplier({ ...supplier, supplier_name: e.target.value })} />
          </label>
          <label className={field}>Supplier invoice reference
            <Input required maxLength={100} className={inputClass} placeholder="e.g. INV-2048" value={supplier.invoice_reference} onChange={e => setSupplier({ ...supplier, invoice_reference: e.target.value })} />
          </label>
          <label className={field}><span>Supplier email <span className="font-normal text-ink/65">(optional)</span></span>
            <Input type="email" maxLength={254} className={inputClass} placeholder="billing@example.com" value={supplier.supplier_email} onChange={e => setSupplier({ ...supplier, supplier_email: e.target.value })} />
          </label>
          <label className={field}><span>Notes <span className="font-normal text-ink/65">(optional)</span></span>
            <textarea maxLength={600} rows={2} className="min-h-16 rounded-xl border border-ink/15 px-3 py-2 text-base font-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink" placeholder="Anything we should know about this invoice?" value={supplier.notes} onChange={e => setSupplier({ ...supplier, notes: e.target.value })} />
          </label>
        </div>
        <Button className={primaryClass + " mt-5 w-full"}>Review request <ArrowRight className="size-4" /></Button>
      </section>
    </form> : <section className={panel}>
      <div className="grid gap-5 lg:grid-cols-2 lg:gap-8">
        <div>
          <h2 className="text-lg font-bold">Transfer amount</h2>
          <SummaryRows rows={[
            ["You send", `${payment.currency} ${money.format(Number(payment.amount))}`],
            ["Supplier receives", receivingAmount ? `${payment.supplier_currency} ${receivingAmount}` : payment.supplier_currency],
            ["Route", payment.route],
            [feeLabel, fee === null ? "Confirmed with quote" : `${payment.currency} ${formatMinor(fee)}`],
          ]} />
          <div className="flex flex-wrap justify-between gap-2 rounded-xl bg-cargo-yellow/20 px-3 py-3 text-sm font-bold"><span>Estimated total</span><span>{total === null ? "—" : `${payment.currency} ${formatMinor(total)}`}</span></div>
        </div>
        <div>
          <h2 className="text-lg font-bold">Supplier details</h2>
          <SummaryRows rows={[
            ["Supplier", supplier.supplier_name],
            ["Invoice reference", supplier.invoice_reference],
            ["Supplier email", supplier.supplier_email],
            ["Notes", supplier.notes],
          ]} />
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-ink/10 pt-4">
        <p className="text-sm text-ink/70">We’ll confirm the quote before you pay.</p>
        <div className="grid w-full gap-2 sm:flex sm:w-auto">
          {!locked && <Button variant="outline" className="h-12 rounded-xl" disabled={submitting} onClick={() => { setError(""); setStep("details"); requestAnimationFrame(() => heading.current?.focus()); }}>Edit details</Button>}
          <Button className={primaryClass} disabled={submitting} onClick={submit}>{submitting && <Loader2 className="size-4 animate-spin" />}{locked ? "Retry submission" : "Submit payment request"}</Button>
        </div>
      </div>
    </section>}
    <section id="transfers" aria-labelledby="transfers-heading" className={panel + " mt-5 scroll-mt-24 lg:mt-6"}>
      <header className="flex items-center gap-3">
        <History className="size-5 shrink-0" aria-hidden="true" />
        <h2 id="transfers-heading" className="text-xl font-bold">Recent transfers</h2>
      </header>
      {requests.isError && <div className="mt-4 flex flex-wrap items-center gap-2" role="status">
        <p className="text-sm text-ink/75">Couldn’t load your transfers.</p>
        <Button variant="outline" onClick={() => void requests.refetch()} disabled={requests.isFetching}>{requests.isFetching ? "Retrying…" : "Retry"}</Button>
      </div>}
      {history.length ? <ul className="mt-3 divide-y divide-ink/10">
        {history.map(transfer => {
          const status = statuses[transfer.status];
          const displayDate = transfer.createdAt && !Number.isNaN(Date.parse(transfer.createdAt)) ? date.format(new Date(transfer.createdAt)) : null;
          return <li key={transfer.reference} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2 py-4 first:border-t first:border-ink/10 last:pb-0 sm:grid-cols-[minmax(0,1.35fr)_minmax(0,.85fr)_minmax(0,1fr)_auto] sm:items-center">
            <div className="min-w-0">
              <p className="break-words font-bold">{transfer.supplierName}</p>
              <p className="break-words text-xs text-ink/70">{transfer.reference}</p>
            </div>
            <div className="col-start-1 row-start-2 text-xs leading-relaxed text-ink/75 sm:col-start-auto sm:row-start-auto sm:text-sm">
              <p>{transfer.route}{transfer.receivingCurrency ? ` · ${transfer.receivingCurrency}` : ""}</p>
              {displayDate && <time dateTime={transfer.createdAt}>{displayDate}</time>}
            </div>
            <div className="col-start-2 row-start-1 min-w-0 self-center text-right sm:col-start-auto sm:row-start-auto">
              <p className="break-words text-sm font-bold tabular-nums sm:text-base">{transfer.currency} {money.format(Number(transfer.amount))}</p>
              <p className="text-xs text-ink/70">{transfer.status === "under_review" ? "Requested amount" : "Total funds"}</p>
            </div>
            {status && <span className={`col-start-2 row-start-2 inline-flex items-center gap-1.5 justify-self-end rounded-full px-2.5 py-1 text-xs font-semibold sm:col-start-auto sm:row-start-auto ${status.style}`}>
              {transfer.status === "paid" ? <CheckCircle2 className="size-3.5" aria-hidden="true" /> : <Clock3 className="size-3.5" aria-hidden="true" />}{status.label}
            </span>}
          </li>;
        })}
      </ul> : !requests.isError && <p role="status" className="mt-4 rounded-xl border border-dashed border-ink/15 bg-[#f6f8fa] px-4 py-5 text-sm text-ink/75">{requests.isPending ? "Loading your transfers…" : "Your payment requests and transfers will appear here."}</p>}
    </section>
  </div>;
}
