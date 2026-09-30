import { CreditCard, Loader2, LockKeyhole, Smartphone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLatestPaymentIntent, usePaymentIntentMutation } from "@/api/hooks";
import type { PaymentIntentDto } from "@/api/contracts";
import { feedback } from "@/lib/feedback";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export type PaymentMethodKind = "mobile_money" | "card";
export type PaymentConfirmation = { kind: PaymentMethodKind; label: string };
type PaymentModalProps = {
  open: boolean; amount: string; reference: string; invoiceId?: string; unavailableMessage?: string;
  onClose: () => void; onSuccess: (payment: PaymentConfirmation) => void;
};

const inputClass = "mt-1 h-11 w-full rounded-lg border border-ink/25 bg-white px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-cargo-yellow";
const actionClass = "flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-cargo-yellow px-4 py-3 text-sm font-bold text-ink hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

export function PaymentModal({ open, amount, reference, invoiceId, unavailableMessage, onClose, onSuccess }: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethodKind>("mobile_money");
  const [phone, setPhone] = useState("");
  const [billing, setBilling] = useState({ firstName: "", lastName: "", email: "", city: "", country: "ZM", address: "", zip: "" });
  const [submitted, setSubmitted] = useState<PaymentIntentDto | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const reported = useRef("");
  const mutation = usePaymentIntentMutation();
  const latest = useLatestPaymentIntent(invoiceId, open && !unavailableMessage);
  const queryClient = useQueryClient();
  const intent = latest.data && (!submitted || latest.data.id === submitted.id) ? latest.data : submitted;
  const pending = intent && !["failed", "succeeded"].includes(intent.status);

  useEffect(() => {
    setSubmitted(null); setError(""); reported.current = "";
  }, [invoiceId]);

  useEffect(() => {
    if (!open || intent?.status !== "succeeded" || reported.current === intent.id) return;
    reported.current = intent.id;
    void queryClient.invalidateQueries();
    onSuccess({ kind: intent.method === "card" ? "card" : "mobile_money", label: intent.method === "card" ? "Lipila card" : "Lipila mobile money" });
  }, [open, intent, onSuccess, queryClient]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busyRef.current || pending || !invoiceId) return;
    busyRef.current = true; setBusy(true); setError("");
    try {
      const result = await mutation.mutateAsync({ invoiceId, method: method === "card" ? "card" : "mobile-money", phone, ...(method === "card" ? { billing } : {}) });
      setSubmitted(result);
      await latest.refetch();
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "We could not confirm this payment. Check its status before trying again.");
      feedback.error("Payment could not be confirmed", { description: "Check its status before trying again." });
      await latest.refetch();
    } finally { busyRef.current = false; setBusy(false); }
  }

  const displayedAmount = intent?.amount
    ? `${intent.amount.currency} ${(intent.amount.amountMinor / 100).toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : amount;
  const checkoutUrl = intent?.checkoutUrl && /^https:\/\/checkout\.primenetpay\.com\//.test(intent.checkoutUrl) ? intent.checkoutUrl : null;

  return <Dialog open={open} onOpenChange={value => { if (!value) onClose(); }}>
    <DialogContent className="max-h-[90dvh] overflow-y-auto bg-white text-ink">
      <DialogTitle className="pr-7">Make a payment</DialogTitle>
      <DialogDescription className="text-ink/75">{reference}</DialogDescription>
      <div className="flex items-center justify-between border-y border-ink/10 py-4"><div><p className="text-sm text-ink/75">Amount to pay</p><p className="mt-1 text-2xl font-bold">{displayedAmount}</p></div><LockKeyhole className="size-5" aria-hidden="true" /></div>
      {unavailableMessage ? <p role="status">{unavailableMessage}</p> : latest.isLoading ? <p className="flex items-center gap-2" role="status"><Loader2 className="size-4 animate-spin" />Checking payment status...</p> : latest.isError && !submitted ? <div role="alert"><p>We could not check your payment status.</p><button className={`${actionClass} mt-3`} onClick={() => void latest.refetch()}>Check again</button></div> : pending ? <div className="space-y-4" aria-live="polite">
        <h3 className="font-bold">{intent.status === "review" ? "Payment needs review" : checkoutUrl ? "Continue to card payment" : "Waiting for payment confirmation"}</h3>
        <p className="text-sm leading-6 text-ink/80">{intent.status === "review" ? "Please contact your branch about this payment. Do not pay again while we check it." : checkoutUrl ? "Complete your payment on Lipila's secure checkout page. Your bill will update once payment is confirmed." : "Approve the request on your mobile-money phone. You can close this window; your bill will update when payment is confirmed. Do not start another payment while this one is pending."}</p>
        {checkoutUrl && intent.status !== "review" && <a href={checkoutUrl} className={actionClass}>Continue to secure checkout<CreditCard className="size-4" /></a>}
        {intent.status !== "review" && <button className={actionClass} disabled={latest.isFetching} onClick={() => void latest.refetch()}>{latest.isFetching ? "Checking..." : "Check payment status"}</button>}
        {latest.isError && <p role="alert" className="text-sm text-red-700">We could not refresh the status. Your payment is still being checked.</p>}
      </div> : intent?.status === "succeeded" ? <p role="status">Payment confirmed.</p> : <form onSubmit={submit} className="space-y-4">
        {intent?.status === "failed" && <p role="alert" className="text-sm text-red-700">Payment was not completed. Check your details before trying again.</p>}
        <fieldset disabled={busy} className="space-y-4">
          <legend className="mb-3 font-semibold">Payment method</legend>
          <div className="grid grid-cols-2 gap-3">{(["mobile_money", "card"] as const).map(value => <label key={value} className={`flex min-h-16 cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm font-semibold ${method === value ? "border-ink bg-cargo-yellow/15" : "border-ink/20 hover:bg-ink/5"}`}><input type="radio" name="payment-method" value={value} checked={method === value} onChange={() => setMethod(value)} />{value === "card" ? <CreditCard className="size-4 shrink-0" /> : <Smartphone className="size-4 shrink-0" />}{value === "card" ? "Card" : "Mobile money"}</label>)}</div>
          <label className="block text-sm font-semibold">{method === "card" ? "Contact number" : "Mobile money number"}<input required type="tel" autoComplete="tel" inputMode="tel" value={phone} onChange={event => setPhone(event.target.value)} placeholder="0972 123 456" pattern="[+0-9 ()-]{10,20}" className={inputClass} /></label>
          {method === "mobile_money" ? <p className="text-sm leading-6 text-ink/80">MTN, Airtel or Zamtel in Zambia. Approve the payment on your phone when prompted.</p> : <>
            <p className="text-sm leading-6 text-ink/80">Enter your billing details, then continue to secure card checkout.</p>
            <div className="grid gap-3 sm:grid-cols-2">{([['firstName', 'First name'], ['lastName', 'Last name'], ['email', 'Email'], ['address', 'Billing address'], ['city', 'City'], ['country', 'Country code'], ['zip', 'Postal code']] as const).map(([key, label]) => <label key={key} className="block text-sm font-semibold">{label}<input required type={key === "email" ? "email" : "text"} maxLength={key === "country" ? 2 : 150} pattern={key === "country" ? "[A-Z]{2}" : undefined} value={billing[key]} onChange={event => setBilling(current => ({ ...current, [key]: key === "country" ? event.target.value.toUpperCase() : event.target.value }))} className={inputClass} /></label>)}</div>
          </>}
        </fieldset>
        {error && <p role="alert" className="text-sm leading-6 text-red-700">{error}</p>}
        <button className={actionClass} type="submit" disabled={busy || !invoiceId || latest.isFetching}>{busy && <Loader2 className="size-4 animate-spin" />}{busy ? "Starting payment..." : method === "card" ? "Continue to card payment" : `Pay ${amount}`}</button>
      </form>}
    </DialogContent>
  </Dialog>;
}
