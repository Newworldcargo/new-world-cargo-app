import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Landmark, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest } from "@/api/http";
import { CustomerApiError } from "@/api/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { clearSupplierForm, clearSupplierPaymentDraft, clearSupplierPaymentReturn, isSupplierAmount, readSupplierForm, readSupplierPaymentDraft, rememberSupplierForm, supplierCurrencies, supplierCurrencyForRoute } from "@/lib/supplier-payment-draft";

type PaymentRequest = { reference: string; supplierName: string; route: string; currency: string; amount: string; status: "under_review" };

const selectClass = "h-12 w-full rounded-xl border border-ink/15 bg-white px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const inputClass = "h-12 rounded-xl border-ink/15 text-base";
const primaryClass = "h-12 rounded-xl bg-cargo-yellow px-6 font-bold text-ink hover:bg-cargo-yellow/90";
const websiteUrl = "https://www.newworldcargo.com/supplier-payments";

export default function SupplierPayments() {
  const { user } = useAuth();
  const [estimate] = useState(readSupplierPaymentDraft);
  const [savedForm] = useState(() => readSupplierForm(user?.id));
  const [payment, setPayment] = useState(savedForm?.payment ?? {
    amount: estimate.amount, currency: estimate.currency,
    supplier_currency: estimate.supplier_currency, route: estimate.route,
  });
  const [supplier, setSupplier] = useState(savedForm?.supplier ?? { supplier_name: "", supplier_email: "", invoice_reference: "", notes: "" });
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
    enabled: Boolean(user?.id) && step === "details",
  });
  const sameEstimate = Object.entries(payment).every(([key, value]) => value === estimate[key as keyof typeof payment]);

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

  return <div className="mx-auto max-w-3xl px-4 py-6 text-ink sm:px-8 sm:py-10">
    <a href={websiteUrl} className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold"><ArrowLeft className="size-4" /> Supplier payment calculator</a>
    <div className="mt-4 rounded-3xl border border-ink/10 bg-white shadow-sm">
      <header className="border-b border-ink/10 px-5 py-6 sm:px-8">
        <div className="mb-4 grid size-11 place-items-center rounded-2xl bg-cargo-yellow/25">
          {result ? <CheckCircle2 className="size-5" /> : <Landmark className="size-5" />}
        </div>
        <h1 ref={heading} tabIndex={-1} className="text-2xl font-bold tracking-tight sm:text-3xl">
          {result ? "Request received" : step === "details" ? "Pay a supplier" : "Review your request"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-ink/65">
          {result ? "Our team will contact you with the confirmed exchange rate, fees and payment instructions." : step === "details" ? "Enter your supplier details to request a payment quote." : "Check the amount and supplier details before submitting."}
        </p>
      </header>
      <div className="p-5 sm:p-8">
        {error && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        {result ? <div className="space-y-4">
          <p className="rounded-xl bg-emerald-50 p-4 text-emerald-900">Reference <strong>{result.reference}</strong> · Under review</p>
          <Link href="/" className="inline-flex min-h-11 items-center font-semibold underline">Return to dashboard</Link>
        </div> : step === "details" ? <form onSubmit={review} className="grid gap-5">
          <div className="grid gap-4 rounded-2xl bg-ink/[.035] p-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">Amount to send
              <Input required inputMode="decimal" maxLength={13} pattern="[0-9]{1,10}([.][0-9]{1,2})?" className={inputClass} value={payment.amount} onChange={e => setPayment({ ...payment, amount: e.target.value })} />
            </label>
            <label className="grid gap-2 text-sm font-semibold">Sending currency
              <select className={selectClass} value={payment.currency} onChange={e => setPayment({ ...payment, currency: e.target.value })}>{supplierCurrencies.map(code => <option key={code}>{code}</option>)}</select>
            </label>
            <label className="grid gap-2 text-sm font-semibold">Receiving currency
              <select className={selectClass} value={payment.supplier_currency} onChange={e => setPayment({ ...payment, supplier_currency: e.target.value })}>{supplierCurrencies.map(code => <option key={code}>{code}</option>)}</select>
            </label>
            <label className="grid gap-2 text-sm font-semibold">Payment route
              <select className={selectClass} value={payment.route} onChange={e => selectRoute(e.target.value)}><option>China</option><option>Dubai</option></select>
            </label>
            {sameEstimate && estimate.receives && <p className="text-sm text-ink/65 sm:col-span-2">Website estimate · Supplier gets {estimate.receives} {payment.supplier_currency}</p>}
          </div>
          <label className="grid gap-2 text-sm font-semibold">Supplier or company name
            <Input required maxLength={160} className={inputClass} value={supplier.supplier_name} onChange={e => setSupplier({ ...supplier, supplier_name: e.target.value })} />
          </label>
          <label className="grid gap-2 text-sm font-semibold">Supplier email (optional)
            <Input type="email" maxLength={254} className={inputClass} value={supplier.supplier_email} onChange={e => setSupplier({ ...supplier, supplier_email: e.target.value })} />
          </label>
          <label className="grid gap-2 text-sm font-semibold">Supplier invoice reference
            <Input required maxLength={100} className={inputClass} value={supplier.invoice_reference} onChange={e => setSupplier({ ...supplier, invoice_reference: e.target.value })} />
          </label>
          <label className="grid gap-2 text-sm font-semibold">Notes (optional)
            <textarea maxLength={600} rows={3} className="rounded-xl border border-ink/15 p-3 text-base" value={supplier.notes} onChange={e => setSupplier({ ...supplier, notes: e.target.value })} />
          </label>
          <Button className={primaryClass}>Review request <ArrowRight className="size-4" /></Button>
        </form> : <div className="grid gap-5">
          <dl className="divide-y divide-ink/10 rounded-2xl bg-ink/[.035] px-4">
            {[
              ["You send", payment.currency + " " + payment.amount],
              ["Receiving currency", payment.supplier_currency],
              ...(sameEstimate && estimate.receives ? [["Estimated supplier amount", payment.supplier_currency + " " + estimate.receives]] : []),
              ["Payment route", payment.route],
              ["Supplier", supplier.supplier_name],
              ["Supplier email", supplier.supplier_email],
              ["Invoice reference", supplier.invoice_reference],
              ["Notes", supplier.notes],
            ].filter(([, value]) => value).map(([label, value]) => <div key={label} className="grid grid-cols-2 gap-3 py-3 text-sm"><dt className="text-ink/65">{label}</dt><dd className="break-words text-right font-semibold">{value}</dd></div>)}
          </dl>
          <p className="text-sm leading-6 text-ink/65">Your final rate and fees will be confirmed before you pay.</p>
          <div className="grid gap-3 sm:flex sm:justify-end">
            {!locked && <Button variant="outline" className="h-12 rounded-xl" disabled={submitting} onClick={() => { setError(""); setStep("details"); requestAnimationFrame(() => heading.current?.focus()); }}>Edit details</Button>}
            <Button className={primaryClass} disabled={submitting} onClick={submit}>{submitting && <Loader2 className="size-4 animate-spin" />}{locked ? "Retry submission" : "Submit payment request"}</Button>
          </div>
        </div>}
      </div>
    </div>
    {!result && step === "details" && Boolean(requests.data?.length) && <section className="mt-6 rounded-2xl border border-ink/10 bg-white p-5">
      <h2 className="font-bold">Recent requests</h2>
      <ul className="mt-3 divide-y divide-ink/10">{requests.data?.map(request => <li key={request.reference} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"><span><strong>{request.reference}</strong> · {request.supplierName}</span><span className="text-ink/65">Under review</span></li>)}</ul>
    </section>}
  </div>;
}
