import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowDown, ArrowRight, ArrowUpRight, Banknote, Building2, Check, CheckCircle2, ChevronLeft, Clock3, CreditCard, History, Loader2, Plus, ShieldCheck, Smartphone } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/api/http";
import { CustomerApiError } from "@/api/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import "./supplier-payments.css";
import { clearSupplierForm, clearSupplierPaymentDraft, clearSupplierPaymentReturn, isSupplierAmount, readSupplierForm, readSupplierPaymentDraft, rememberSupplierForm, supplierCurrencies, supplierCurrencyForRoute, type SupplierPaymentMethod, type SupplierPaymentStep } from "@/lib/supplier-payment-draft";

type PaymentRequest = { reference: string; supplierName: string; route: string; currency: string; amount: string; receivingCurrency?: string; createdAt?: string; paymentMethod?: SupplierPaymentMethod | null; status: "under_review" | "pending_confirmation" | "paid" };

type SavedSupplier = { id: string; name: string; email: string | null };

const inputClass = "h-12 rounded-xl border-ink/20 bg-white text-base md:text-base";
const primaryClass = "h-12 gap-2 rounded-xl bg-[#012642] px-5 font-semibold text-[#fff]! hover:bg-[#143e57] disabled:opacity-45";
const secondaryClass = "h-12 gap-2 rounded-xl border-ink/20 px-5 font-semibold";
const panel = "min-w-0 rounded-[1.5rem] border border-ink/10 bg-white p-4 shadow-sm sm:p-8";
const field = "grid min-w-0 gap-1.5 text-sm font-semibold";
const money = new Intl.NumberFormat("en-ZM", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const date = new Intl.DateTimeFormat("en-ZM", { dateStyle: "medium", timeZone: "Africa/Lusaka" });
const currencies = {
  ZMW: ["zm", "Zambian kwacha"], USD: ["us", "US dollar"], CNY: ["cn", "Chinese yuan"],
  AED: ["ae", "UAE dirham"], EUR: ["eu", "Euro"],
  GBP: ["gb", "British pound"], ZAR: ["za", "South African rand"],
} satisfies Record<typeof supplierCurrencies[number], [string, string]>;
const paymentMethods = {
  office_cash: { label: "Cash deposit at an office", icon: Building2 },
  atm_deposit: { label: "ATM or bank deposit", icon: Banknote },
  card: { label: "Debit or credit card", icon: CreditCard },
  mobile_money: { label: "Mobile money", icon: Smartphone },
} satisfies Record<SupplierPaymentMethod, { label: string; icon: typeof CreditCard }>;
const steps = [
  { id: "transfer", label: "Transfer", title: "Transfer details" },
  { id: "supplier", label: "Supplier", title: "Supplier details" },
  { id: "review", label: "Review", title: "Review your request" },
] as const;
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

function CurrencyFlag({ code }: { code: typeof supplierCurrencies[number] }) {
  const [country] = currencies[code];
  return <img src={`/flags/${country}.png`} alt="" width={24} height={24} className="size-6 shrink-0 rounded-full object-fill ring-1 ring-black/5" />;
}

function CurrencyPicker({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const code = value as typeof supplierCurrencies[number];
  return <Select value={value} onValueChange={onChange}>
    <SelectTrigger aria-label={label} className="w-auto shrink-0 gap-1.5 rounded-xl border-ink/15 bg-white px-2.5 font-bold data-[size=default]:h-11 sm:gap-2 sm:px-3">
      <SelectValue><CurrencyFlag code={code} />{code}</SelectValue>
    </SelectTrigger>
    <SelectContent align="end" className="min-w-48 rounded-xl border-ink/10 bg-white text-ink">
      {supplierCurrencies.map(item => <SelectItem key={item} value={item} textValue={item} className="min-h-11 cursor-pointer rounded-lg">
        <CurrencyFlag code={item} />
        <span className="font-bold">{item}</span><span className="text-xs text-ink/70">{currencies[item][1]}</span>
      </SelectItem>)}
    </SelectContent>
  </Select>;
}

function useMobileKeyboard() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () => {
      // The keyboard shrinks the visual viewport while the layout viewport stays in place.
      setOpen(viewport.scale === 1 && window.innerHeight - viewport.height > 120);
    };
    viewport.addEventListener("resize", update);
    update();
    return () => viewport.removeEventListener("resize", update);
  }, []);
  return open;
}

function StatusBadge({ status }: { status: PaymentRequest["status"] }) {
  const display = statuses[status];
  if (!display) return null;
  const Icon = status === "paid" ? CheckCircle2 : Clock3;
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${display.style}`}>
    <Icon className="size-3.5" aria-hidden="true" />{display.label}
  </span>;
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
  const keyboardOpen = useMobileKeyboard();
  const [estimate] = useState(readSupplierPaymentDraft);
  const [savedForm] = useState(() => readSupplierForm(user?.id));
  const [payment, setPayment] = useState(savedForm?.payment ?? {
    amount: estimate.amount, currency: estimate.currency,
    supplier_currency: estimate.supplier_currency, route: estimate.route,
  });
  const [supplier, setSupplier] = useState(savedForm?.supplier ?? emptySupplier);
  const [paymentMethod, setPaymentMethod] = useState<SupplierPaymentMethod | undefined>(savedForm?.paymentMethod);
  const [step, setStep] = useState<SupplierPaymentStep>(savedForm?.locked ? "review" : savedForm?.step ?? "transfer");
  const [tab, setTab] = useState(window.location.hash === "#transfers" ? "transfers" : "quote");
  const [savedSupplierId, setSavedSupplierId] = useState(savedForm?.savedSupplierId ?? "new");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState<PaymentRequest | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [locked, setLocked] = useState(savedForm?.locked ?? false);
  const inFlight = useRef(false);
  const submission = useRef(savedForm?.submissionKey ?? "");
  const heading = useRef<HTMLHeadingElement>(null);
  const transfersHeading = useRef<HTMLHeadingElement>(null);
  const requests = useQuery({
    queryKey: ["customer", user?.id, "supplier-payment-requests"],
    queryFn: () => apiRequest<PaymentRequest[]>("/supplier-payment-requests"),
    enabled: Boolean(user?.id),
  });
  const savedSuppliers = useQuery({
    queryKey: ["customer", user?.id, "supplier-payment-suppliers"],
    queryFn: () => apiRequest<SavedSupplier[]>("/supplier-payment-suppliers"),
    enabled: Boolean(user?.id) && (step === "supplier" || Boolean(result)),
    staleTime: 60_000,
    retry: false,
  });
  const rates = useQuery({ queryKey: ["supplier-payment-rates"], queryFn: ({ signal }) => fetchRates(signal), staleTime: 60_000, retry: false });
  const candidate = rates.data?.rates[payment.currency]?.[payment.supplier_currency];
  const rate = !rates.isError && typeof candidate === "string" && /^\d{1,12}\.\d{12}$/.test(candidate) && Number(candidate) > 0 ? candidate : null;
  const feeBps = rates.isError ? undefined : rates.data?.feeBps;
  const { receives, fee, total } = estimateAmounts(payment.amount, rate, feeBps);
  const receivingAmount = receives === null ? null : formatMinor(receives);
  const feeLabel = feeBps === undefined ? "Handling fee" : `Handling fee (${feeBps / 100}%)`;
  const transfers = requests.data ?? [];
  const history = result && !transfers.some(transfer => transfer.reference === result.reference) ? [result, ...transfers] : transfers;

  const amountValid = isSupplierAmount(payment.amount);
  const emailValid = !supplier.supplier_email.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supplier.supplier_email.trim());
  const supplierValid = Boolean(supplier.supplier_name.trim() && supplier.invoice_reference.trim() && emailValid && paymentMethod);
  const currentStep = steps.findIndex(item => item.id === step);
  const estimatedFee = fee === null ? "Awaiting quote" : `${payment.currency} ${formatMinor(fee)}`;
  const estimatedTotal = total === null ? "Awaiting quote" : `${payment.currency} ${formatMinor(total)}`;

  useEffect(clearSupplierPaymentReturn, []);
  useEffect(() => {
    if (user?.id && !result) rememberSupplierForm(user.id, { payment, supplier, paymentMethod, step, savedSupplierId, submissionKey: submission.current, locked });
  }, [user?.id, result, payment, supplier, paymentMethod, step, savedSupplierId, locked]);
  useEffect(() => {
    const updateTab = () => setTab(window.location.hash === "#transfers" ? "transfers" : "quote");
    window.addEventListener("hashchange", updateTab);
    return () => window.removeEventListener("hashchange", updateTab);
  }, []);

  function selectTab(next: string) {
    setTab(next);
    const { pathname, search } = window.location;
    window.history.replaceState(window.history.state, "", pathname + search + (next === "transfers" ? "#transfers" : ""));
  }

  function selectRoute(route: string) {
    setPayment(current => ({ ...current, route, supplier_currency: supplierCurrencyForRoute(route) }));
  }

  function goTo(next: SupplierPaymentStep) {
    setError("");
    setStep(next);
    requestAnimationFrame(() => heading.current?.focus());
  }

  function selectSupplier(id: string) {
    const contact = savedSuppliers.data?.find(item => item.id === id);
    setSavedSupplierId(id);
    setSupplier(current => ({ ...current, supplier_name: contact?.name ?? "", supplier_email: contact?.email ?? "" }));
    setTouched(current => ({ ...current, supplier_name: false, supplier_email: false }));
  }

  function updateSupplier(field: keyof typeof emptySupplier, value: string) {
    if (field === "supplier_name" || field === "supplier_email") setSavedSupplierId("new");
    setSupplier(current => ({ ...current, [field]: value }));
  }

  function markTouched(key: string) {
    setTouched(current => ({ ...current, [key]: true }));
  }

  function continueTransfer(event: FormEvent) {
    event.preventDefault();
    if (amountValid) goTo("supplier");
  }

  function review(event: FormEvent) {
    event.preventDefault();
    if (supplierValid) goTo("review");
  }

  async function submit() {
    if (inFlight.current || (!locked && (!amountValid || !supplierValid))) return;
    inFlight.current = true;
    setSubmitting(true);
    setError("");
    try {
      submission.current ||= crypto.randomUUID();
      if (user?.id) rememberSupplierForm(user.id, { payment, supplier, paymentMethod, step, savedSupplierId, submissionKey: submission.current, locked: true });
      const response = await apiRequest<PaymentRequest>("/supplier-payment-requests", {
        method: "POST",
        body: { ...payment, ...supplier, payment_method: paymentMethod, submission_key: submission.current },
      });
      clearSupplierPaymentDraft();
      clearSupplierForm();
      setResult(response);
      void requests.refetch();
      void savedSuppliers.refetch();
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
    setPaymentMethod(undefined);
    setSavedSupplierId("new");
    setTouched({});
    setResult(null);
    setLocked(false);
    goTo("transfer");
  }

  return <div data-keyboard-open={keyboardOpen || undefined} className={`supplier-payments mx-auto max-w-6xl text-ink sm:px-8 sm:pb-12 sm:pt-10 ${tab === "quote" && !result ? "supplier-payments--wizard" : ""}`}>
    <header>
      <h1 className="text-[1.65rem] font-bold sm:text-[clamp(1.7rem,4vw,2.6rem)]">Supplier payments</h1>
    </header>
    <Tabs value={tab} onValueChange={selectTab} className="mt-3 gap-0 sm:mt-5">
      <TabsList aria-label="Supplier payment views" className="h-auto w-fit justify-start gap-0.5 rounded-2xl bg-[#dfeaf2] p-1 sm:w-full sm:gap-7 sm:rounded-none sm:border-b sm:border-ink/10 sm:bg-transparent sm:p-0">
        <TabsTrigger value="quote" className="relative min-h-11 flex-none rounded-xl border-0 px-3 text-ink/75 data-[state=active]:bg-white data-[state=active]:font-bold data-[state=active]:text-ink sm:rounded-none sm:px-1 sm:after:absolute sm:after:inset-x-0 sm:after:-bottom-px sm:after:h-0.5 sm:data-[state=active]:bg-transparent sm:data-[state=active]:shadow-none sm:data-[state=active]:after:bg-[#012642]">
          <ArrowUpRight className="size-4" aria-hidden="true" /><span className="sm:hidden">Exchange</span><span className="hidden sm:inline">Request a quote</span>
        </TabsTrigger>
        <TabsTrigger value="transfers" className="relative min-h-11 flex-none rounded-xl border-0 px-3 text-ink/75 data-[state=active]:bg-white data-[state=active]:font-bold data-[state=active]:text-ink sm:rounded-none sm:px-1 sm:after:absolute sm:after:inset-x-0 sm:after:-bottom-px sm:after:h-0.5 sm:data-[state=active]:bg-transparent sm:data-[state=active]:shadow-none sm:data-[state=active]:after:bg-[#012642]">
          <History className="size-4" aria-hidden="true" /> Transfers
        </TabsTrigger>
      </TabsList>
      <TabsContent value="quote" className="mt-5 sm:mt-9">
        <div className="mx-auto max-w-2xl">
          {!result && <ol aria-label="Request progress" className="mb-4 grid grid-cols-3 gap-2 sm:mb-7 sm:gap-4">
            {steps.map((item, index) => <li key={item.id} aria-current={item.id === step ? "step" : undefined} className={`relative flex min-w-0 items-center gap-1.5 pt-3 text-xs before:absolute before:inset-x-0 before:top-0 before:h-0.5 sm:gap-2 sm:pt-4 sm:text-sm ${index <= currentStep ? "text-ink before:bg-[#012642]" : "text-ink/60 before:bg-ink/10"}`}>
              <span className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-medium ${item.id === step ? "bg-[#012642] text-[#fff]" : "bg-[#f1f4f6]"}`} aria-hidden="true">{index < currentStep ? <Check className="size-3.5" /> : index + 1}</span>
              <span className={item.id === step ? "font-bold" : "font-medium"}>{item.label}</span>
            </li>)}
          </ol>}
          <section className={panel + " supplier-wizard-card max-sm:rounded-[1.75rem]"} aria-labelledby="quote-heading">
            <header className={`mb-4 sm:mb-6 ${!result && step === "transfer" ? "max-sm:sr-only" : ""}`}>
              {result && <div className="mb-4 grid size-12 place-items-center rounded-full bg-emerald-50 text-emerald-800"><CheckCircle2 className="size-6" aria-hidden="true" /></div>}
              <h2 ref={heading} id="quote-heading" tabIndex={-1} className="scroll-mt-24 text-xl font-bold focus:outline-none sm:text-[1.75rem]">
                {result ? "Quote request received" : steps[currentStep].title}
              </h2>
              {result && <p className="mt-2 text-sm text-ink/70">We’ll review your request and contact you with the confirmed quote and payment instructions.</p>}
            </header>
            {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
            {result ? <>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#f4f7f9] p-4">
                <div><p className="text-xs text-ink/70">Request reference</p><p className="mt-1 font-bold">{result.reference}</p></div>
                <StatusBadge status={result.status} />
              </div>
              <div className="mt-6 grid gap-2.5 sm:flex sm:justify-end">
                <Button type="button" variant="outline" className={secondaryClass} onClick={newRequest}><Plus className="size-4" /> New request</Button>
                <Button type="button" className={primaryClass} onClick={() => {
                  selectTab("transfers");
                  requestAnimationFrame(() => transfersHeading.current?.focus());
                }}>View transfers <ArrowRight className="size-4" /></Button>
              </div>
            </> : step === "transfer" ? <form key="transfer" className="supplier-wizard-stage" onSubmit={continueTransfer} noValidate>
              <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-transparent bg-[#edf3f8] px-3 py-2.5 sm:rounded-xl sm:py-3 focus-within:border-ink/35 sm:gap-4 sm:px-4">
                <label className="grid min-w-0 flex-1 gap-1 text-sm font-medium text-ink/75">Amount to send
                  <input required inputMode="decimal" maxLength={13} aria-invalid={Boolean(touched.amount && !amountValid)} aria-describedby={touched.amount && !amountValid ? "quote-amount-error" : undefined} className="w-full min-w-0 rounded-sm bg-transparent py-0.5 text-[1.75rem] font-bold tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink/75 sm:text-3xl" placeholder="0.00" value={payment.amount} onChange={e => setPayment({ ...payment, amount: e.target.value })} onBlur={() => markTouched("amount")} />
                </label>
                <CurrencyPicker label="Sending currency" value={payment.currency} onChange={currency => setPayment({ ...payment, currency })} />
              </div>
              {touched.amount && !amountValid && <p id="quote-amount-error" className="mt-2 text-sm text-red-700">Enter an amount greater than zero, with up to two decimal places.</p>}
              <div className="ml-5 flex min-h-9 items-center sm:min-h-11 gap-2 border-l border-dashed border-ink/25 pl-3 text-xs font-medium text-ink/75 sm:ml-6" role="status">
                <ArrowDown className="size-3.5 shrink-0" aria-hidden="true" />
                {rate ? `Estimated rate: 1 ${payment.currency} = ${Number(rate).toLocaleString("en-ZM", { maximumFractionDigits: 12 })} ${payment.supplier_currency}` : rates.isPending ? "Checking exchange rate…" : "Exchange rate awaiting quote"}
              </div>
              <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-transparent bg-[#edf3f8] px-3 py-2.5 sm:rounded-xl sm:py-3 sm:gap-4 sm:px-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink/75" id="receiving-amount-label">Supplier receives</p>
                  <output aria-labelledby="receiving-amount-label" className={`block break-words pt-0.5 font-bold tabular-nums ${amountValid && !receivingAmount ? "text-base" : "text-[1.75rem] sm:text-3xl"}`}>{amountValid ? receivingAmount ?? "Awaiting quote" : "0.00"}</output>
                </div>
                <CurrencyPicker label="Receiving currency" value={payment.supplier_currency} onChange={supplier_currency => setPayment({ ...payment, supplier_currency })} />
              </div>
              <fieldset className="mt-4 sm:mt-5">
                <legend className="mb-2 text-sm font-semibold">Payment route</legend>
                <div className="grid grid-cols-2 gap-2.5">
                  {["China", "Dubai"].map(route => <label key={route} className={`flex min-h-12 cursor-pointer items-center justify-between gap-2 rounded-xl border px-3 text-sm font-semibold focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink sm:px-4 ${payment.route === route ? "border-[#012642] bg-[#eef4f7]" : "border-ink/15 hover:bg-ink/5"}`}>
                    <span className="flex items-center gap-2"><CurrencyFlag code={supplierCurrencyForRoute(route) === "CNY" ? "CNY" : "AED"} />{route}</span><input className="size-4 shrink-0 accent-[#012642]" type="radio" name="payment-route" value={route} checked={payment.route === route} onChange={() => selectRoute(route)} />
                  </label>)}
                </div>
              </fieldset>
              <dl className="mt-4 border-t border-ink/10 pt-3 text-sm sm:mt-5 sm:pt-4">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-2"><dt className="text-ink/75">Estimated {feeLabel.toLowerCase()}</dt><dd className="text-right font-medium tabular-nums">{estimatedFee}</dd></div>
                <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-2"><dt className="font-semibold"><span className="sm:hidden">Estimated total</span><span className="hidden sm:inline">Estimated total payable</span></dt><dd className="text-right text-lg font-bold tabular-nums sm:text-2xl">{estimatedTotal}</dd></div>
              </dl>
              <div className="supplier-wizard-actions mt-5">
                <Button className={primaryClass + " w-full"} disabled={!amountValid}>Continue to supplier <ArrowRight className="size-4" /></Button>
              </div>
            </form> : step === "supplier" ? <form key="supplier" className="supplier-wizard-stage" onSubmit={review} noValidate>
              <div className="grid gap-4">
                <div className="grid gap-1.5">
                  <label htmlFor="saved-supplier" className="text-sm font-semibold">Supplier</label>
                  <Select value={savedSupplierId} onValueChange={selectSupplier}>
                    <SelectTrigger id="saved-supplier" className="w-full rounded-xl border-ink/20 bg-white text-left data-[size=default]:h-12"><SelectValue placeholder="Select or add a supplier" /></SelectTrigger>
                    <SelectContent align="start" className="max-w-[calc(100vw-3rem)] rounded-xl bg-white text-ink">
                      <SelectItem value="new" className="min-h-11 rounded-lg"><Plus className="size-4" /> Add new supplier</SelectItem>
                      {savedSuppliers.data?.map(contact => <SelectItem key={contact.id} value={contact.id} textValue={contact.name} className="min-h-11 rounded-lg">
                        <span className="block truncate">{contact.name}{contact.email && <span className="ml-2 text-xs text-ink/65">{contact.email}</span>}</span>
                      </SelectItem>)}
                    </SelectContent>
                  </Select>
                  {savedSuppliers.isPending && <p className="text-xs text-ink/70" role="status">Loading saved suppliers…</p>}
                  {savedSuppliers.isError && <div className="flex flex-wrap items-center gap-x-2 text-xs text-ink/75" role="status">
                    Saved suppliers are unavailable.
                    <button type="button" className="min-h-9 font-semibold underline" onClick={() => void savedSuppliers.refetch()} disabled={savedSuppliers.isFetching}>Retry</button>
                  </div>}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className={field}>Supplier or company name
                    <Input required maxLength={160} autoComplete="off" aria-invalid={Boolean(touched.supplier_name && !supplier.supplier_name.trim())} className={inputClass} placeholder="Enter supplier name" value={supplier.supplier_name} onChange={e => updateSupplier("supplier_name", e.target.value)} onBlur={() => markTouched("supplier_name")} />
                    {touched.supplier_name && !supplier.supplier_name.trim() && <span className="text-xs font-normal text-red-700">Enter the supplier’s name.</span>}
                  </label>
                  <label className={field}>Supplier invoice reference
                    <Input required maxLength={100} aria-invalid={Boolean(touched.invoice_reference && !supplier.invoice_reference.trim())} className={inputClass} placeholder="e.g. INV-2048" value={supplier.invoice_reference} onChange={e => updateSupplier("invoice_reference", e.target.value)} onBlur={() => markTouched("invoice_reference")} />
                    {touched.invoice_reference && !supplier.invoice_reference.trim() && <span className="text-xs font-normal text-red-700">Enter the invoice reference.</span>}
                  </label>
                  <label className={field}><span>Supplier email <span className="font-normal text-ink/65">(optional)</span></span>
                    <Input type="email" maxLength={254} aria-invalid={Boolean(touched.supplier_email && !emailValid)} className={inputClass} placeholder="billing@example.com" value={supplier.supplier_email} onChange={e => updateSupplier("supplier_email", e.target.value)} onBlur={() => markTouched("supplier_email")} />
                    {touched.supplier_email && !emailValid && <span className="text-xs font-normal text-red-700">Enter a valid email address.</span>}
                  </label>
                  <div className={field}>
                    <label htmlFor="quote-method">How you’d like to pay</label>
                    <Select value={paymentMethod} onValueChange={value => setPaymentMethod(value as SupplierPaymentMethod)} required>
                      <SelectTrigger id="quote-method" className="w-full rounded-xl border-ink/20 bg-white text-left data-[size=default]:h-12"><SelectValue placeholder="Select payment method" /></SelectTrigger>
                      <SelectContent className="max-w-[calc(100vw-3rem)] rounded-xl bg-white text-ink">
                        {Object.entries(paymentMethods).map(([key, { label, icon: Icon }]) => <SelectItem key={key} value={key} className="min-h-11 rounded-lg"><Icon className="size-4" /> {label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <label className={field}><span>Notes <span className="font-normal text-ink/65">(optional)</span></span>
                  <textarea maxLength={600} rows={2} className="min-h-16 rounded-xl border border-ink/20 px-3 py-2 text-base font-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink" placeholder="Add a note for our team" value={supplier.notes} onChange={e => updateSupplier("notes", e.target.value)} />
                </label>
              </div>
              <div className="supplier-wizard-actions mt-6 grid grid-cols-[auto_minmax(0,1fr)] gap-2.5 sm:flex sm:justify-between">
                <Button type="button" variant="outline" className={secondaryClass} onClick={() => goTo("transfer")}><ChevronLeft className="size-4" /> Back</Button>
                <Button className={primaryClass + " px-2 sm:px-5"} disabled={!supplierValid}>Continue to review <ArrowRight className="size-4" /></Button>
              </div>
            </form> : <div key="review" className="supplier-wizard-stage">
              <div className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl bg-[#edf3f6] p-4">
                <span className="text-sm font-semibold">Estimated total payable</span><span className="text-xl font-bold tabular-nums sm:text-2xl">{estimatedTotal}</span>
              </div>
              <div className="mt-3 grid gap-x-7 sm:grid-cols-2">
                <div>
                  <h3 className="mt-4 font-bold">Transfer</h3>
                  <SummaryRows rows={[
                    ["You send", `${payment.currency} ${money.format(Number(payment.amount))}`],
                    ["Receive in", payment.supplier_currency],
                    ["Est. to supplier", receivingAmount ? `${payment.supplier_currency} ${receivingAmount}` : "Awaiting quote"],
                    ["Payment route", payment.route],
                    [`Est. ${feeLabel.toLowerCase()}`, estimatedFee],
                  ]} />
                </div>
                <div>
                  <h3 className="mt-4 font-bold">Supplier</h3>
                  <SummaryRows rows={[
                    ["Supplier", supplier.supplier_name],
                    ["Invoice reference", supplier.invoice_reference],
                    ["Supplier email", supplier.supplier_email],
                    ["Payment method", paymentMethod ? paymentMethods[paymentMethod].label : ""],
                    ["Notes", supplier.notes],
                  ]} />
                </div>
              </div>
              <p className="mt-4 flex items-start gap-2 rounded-xl bg-[#f3f6f8] p-3 text-sm text-ink/75"><ShieldCheck className="size-4 shrink-0" aria-hidden="true" /> We’ll confirm your rate and fees before you pay.</p>
              <div className="supplier-wizard-actions mt-5 flex gap-2.5 sm:justify-between">
                {!locked && <Button type="button" aria-label="Back to supplier" variant="outline" className={secondaryClass} disabled={submitting} onClick={() => goTo("supplier")}><ChevronLeft className="size-4" /><span className="sm:hidden">Back</span><span className="hidden sm:inline">Back to supplier</span></Button>}
                <Button type="button" className={primaryClass + " min-w-0 flex-1 px-2 sm:ml-auto sm:flex-none sm:px-5"} disabled={submitting} onClick={submit}>
                  {submitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                  {submitting ? "Requesting quote…" : locked ? "Retry request" : "Request Quote"}
                  {!submitting && <ArrowRight className="size-4" aria-hidden="true" />}
                </Button>
              </div>
            </div>}
          </section>
        </div>
      </TabsContent>
      <TabsContent value="transfers" className="mt-5 sm:mt-9">
        <section aria-labelledby="transfers-heading" className={panel}>
          <header className="flex items-center gap-3">
            <h2 ref={transfersHeading} id="transfers-heading" tabIndex={-1} className="text-xl font-bold focus:outline-none">Recent transfers</h2>
          </header>
          {requests.isError && <div className="mt-4 flex flex-wrap items-center gap-2" role="status">
            <p className="text-sm text-ink/75">Couldn’t load your transfers.</p>
            <Button variant="outline" onClick={() => void requests.refetch()} disabled={requests.isFetching}>{requests.isFetching ? "Retrying…" : "Retry"}</Button>
          </div>}
          {history.length > 0 && <div aria-hidden="true" className="mt-6 hidden grid-cols-[minmax(0,1.35fr)_minmax(0,.85fr)_minmax(0,1fr)_9rem] gap-3 px-1 text-xs font-medium text-ink/65 sm:grid">
            <span>Supplier</span><span>Route and date</span><span className="text-right">Amount</span><span className="text-right">Status</span>
          </div>}
          {history.length ? <ul className="mt-3 divide-y divide-ink/10">
            {history.map(transfer => {
              const displayDate = transfer.createdAt && !Number.isNaN(Date.parse(transfer.createdAt)) ? date.format(new Date(transfer.createdAt)) : null;
              return <li key={transfer.reference} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2 py-4 first:border-t first:border-ink/10 last:pb-0 sm:grid-cols-[minmax(0,1.35fr)_minmax(0,.85fr)_minmax(0,1fr)_9rem] sm:items-center">
                <div className="min-w-0">
                  <p className="break-words font-bold">{transfer.supplierName}</p>
                  <p className="break-words text-xs text-ink/70">{transfer.reference}</p>
                </div>
                <div className="col-start-1 row-start-2 text-xs leading-relaxed text-ink/75 sm:col-start-auto sm:row-start-auto sm:text-sm">
                  <p>{transfer.route}{transfer.receivingCurrency ? ` · ${transfer.receivingCurrency}` : ""}</p>
                  {displayDate && <time dateTime={transfer.createdAt}>{displayDate}</time>}
                  {transfer.paymentMethod && paymentMethods[transfer.paymentMethod] && <p>{paymentMethods[transfer.paymentMethod].label}</p>}
                </div>
                <div className="col-start-2 row-start-1 min-w-0 self-center text-right sm:col-start-auto sm:row-start-auto">
                  <p className="break-words text-sm font-bold tabular-nums sm:text-base">{transfer.currency} {money.format(Number(transfer.amount))}</p>
                  <p className="text-xs text-ink/70">{transfer.status === "under_review" ? "Requested amount" : "Total funds"}</p>
                </div>
                <div className="col-start-2 row-start-2 justify-self-end sm:col-start-auto sm:row-start-auto"><StatusBadge status={transfer.status} /></div>
              </li>;
            })}
          </ul> : !requests.isError && <p role="status" className="mt-4 rounded-xl border border-dashed border-ink/15 bg-[#f6f8fa] px-4 py-5 text-sm text-ink/75">{requests.isPending ? "Loading your transfers…" : "Your payment requests and transfers will appear here."}</p>}
        </section>
      </TabsContent>
    </Tabs>
  </div>;
}
