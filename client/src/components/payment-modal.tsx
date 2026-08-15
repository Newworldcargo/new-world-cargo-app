// New World Cargo payment style: operational white modal, navy ink, Cargo Yellow confirmation, practical mobile-first fields.

import { Check, ChevronLeft, CreditCard, Landmark, LockKeyhole, Smartphone, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export type PaymentMethodKind = "mobile_money" | "card";

export type PaymentConfirmation = {
  kind: PaymentMethodKind;
  label: string;
};

type PaymentModalProps = {
  open: boolean;
  amount: string;
  reference: string;
  onClose: () => void;
  onSuccess: (payment: PaymentConfirmation) => void;
};

const LAST_PAYMENT_KEY = "nwc-last-payment-method";

function getInitialMethod(): PaymentMethodKind {
  if (typeof window === "undefined") return "mobile_money";
  const stored = window.localStorage.getItem(LAST_PAYMENT_KEY);
  return stored === "card" ? "card" : "mobile_money";
}

export function PaymentModal({ open, amount, reference, onClose, onSuccess }: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethodKind>(getInitialMethod);
  const [mobileProvider, setMobileProvider] = useState("Airtel Money");
  const [phone, setPhone] = useState("+260 977 123 456");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMethod(getInitialMethod());
    setSubmitting(false);
  }, [open]);

  const methodLabel = useMemo(() => method === "mobile_money" ? `${mobileProvider} · ${phone || "new number"}` : cardNumber ? `Card ending ${cardNumber.replace(/\D/g, "").slice(-4)}` : "New debit or ATM card", [cardNumber, method, mobileProvider, phone]);

  if (!open) return null;

  const submitPayment = () => {
    if (method === "mobile_money" && phone.replace(/\D/g, "").length < 9) return;
    if (method === "card" && (cardNumber.replace(/\D/g, "").length < 12 || !cardName.trim() || cardExpiry.length < 4 || cardCvv.length < 3)) return;
    setSubmitting(true);
    window.setTimeout(() => {
      window.localStorage.setItem(LAST_PAYMENT_KEY, method);
      setSubmitting(false);
      onSuccess({ kind: method, label: methodLabel });
    }, 650);
  };

  const invalid = method === "mobile_money"
    ? phone.replace(/\D/g, "").length < 9
    : cardNumber.replace(/\D/g, "").length < 12 || !cardName.trim() || cardExpiry.length < 4 || cardCvv.length < 3;

  return <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40 p-3 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Make a payment">
    <div className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-lg flex-col overflow-hidden rounded-[30px] border border-ink/10 bg-white shadow-2xl sm:max-h-[min(720px,calc(100dvh-3rem))]">
      <div className="flex shrink-0 items-center justify-between border-b border-ink/8 px-5 py-4 sm:px-7"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-ink/45">Secure payment</p><p className="mt-1 text-sm font-semibold text-ink">{reference}</p></div><button onClick={onClose} className="grid size-9 place-items-center rounded-full border border-ink/10 text-ink/50 transition hover:bg-ink/5 hover:text-ink" aria-label="Close payment"><X className="size-4" /></button></div>
      <div className="min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-7"><div className="flex items-center justify-between rounded-2xl bg-[#f7f8fa] p-4"><div><p className="text-xs font-semibold text-ink/45">Amount to pay</p><p className="mt-1 font-heading text-2xl font-extrabold text-ink">{amount}</p></div><LockKeyhole className="size-5 text-ink/35" /></div>
        <div className="mt-6"><p className="text-sm font-bold text-ink">Choose payment method</p><p className="mt-1 text-xs leading-5 text-ink/50">Your last successful method is selected automatically.</p><div className="mt-4 grid grid-cols-2 gap-3"><button onClick={() => setMethod("mobile_money")} className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${method === "mobile_money" ? "border-cargo-yellow bg-cargo-yellow/15" : "border-ink/10 hover:bg-ink/[0.03]"}`}><span className={`grid size-9 place-items-center rounded-xl ${method === "mobile_money" ? "bg-cargo-yellow text-ink" : "bg-ink/5 text-ink/55"}`}><Smartphone className="size-4" /></span><span><span className="block text-sm font-bold text-ink">Mobile money</span><span className="mt-0.5 block text-[11px] text-ink/45">Airtel, MTN or Zamtel</span></span>{method === "mobile_money" && <Check className="ml-auto size-4 text-ink" />}</button><button onClick={() => setMethod("card")} className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${method === "card" ? "border-cargo-yellow bg-cargo-yellow/15" : "border-ink/10 hover:bg-ink/[0.03]"}`}><span className={`grid size-9 place-items-center rounded-xl ${method === "card" ? "bg-cargo-yellow text-ink" : "bg-ink/5 text-ink/55"}`}><CreditCard className="size-4" /></span><span><span className="block text-sm font-bold text-ink">ATM / debit card</span><span className="mt-0.5 block text-[11px] text-ink/45">Add a card securely</span></span>{method === "card" && <Check className="ml-auto size-4 text-ink" />}</button></div></div>
        {method === "mobile_money" ? <div className="mt-6 space-y-4"><div><p className="mb-2 text-xs font-bold text-ink/50">Mobile money provider</p><div className="grid grid-cols-3 gap-2">{["Airtel Money", "MTN MoMo", "Zamtel Kwacha"].map((provider) => <button key={provider} onClick={() => setMobileProvider(provider)} className={`rounded-xl border px-2 py-3 text-xs font-bold transition ${mobileProvider === provider ? "border-cargo-yellow bg-cargo-yellow/15 text-ink" : "border-ink/10 text-ink/55 hover:bg-ink/[0.03]"}`}>{provider.replace(" Money", "").replace(" Kwacha", "")}</button>)}</div></div><label className="block"><span className="mb-2 block text-xs font-bold text-ink/50">Mobile money number</span><div className="flex items-center gap-3 rounded-2xl border border-ink/10 px-4"><Smartphone className="size-4 text-ink/35" /><input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" className="h-12 min-w-0 flex-1 bg-transparent text-sm font-semibold text-ink outline-none" /></div></label><div className="flex items-start gap-2 rounded-xl bg-cargo-yellow/15 p-3 text-xs leading-5 text-ink"><Landmark className="mt-0.5 size-4 shrink-0" />You will approve this payment on your phone after continuing.</div></div> : <div className="mt-6 space-y-4"><label className="block"><span className="mb-2 block text-xs font-bold text-ink/50">Cardholder name</span><input value={cardName} onChange={(event) => setCardName(event.target.value)} placeholder="Name on card" autoComplete="cc-name" className="h-12 w-full rounded-2xl border border-ink/10 px-4 text-sm font-semibold text-ink outline-none focus:border-cargo-yellow" /></label><label className="block"><span className="mb-2 block text-xs font-bold text-ink/50">Card number</span><div className="flex items-center gap-3 rounded-2xl border border-ink/10 px-4"><CreditCard className="size-4 text-ink/35" /><input value={cardNumber} onChange={(event) => setCardNumber(event.target.value.replace(/[^\d ]/g, "").slice(0, 19))} placeholder="0000 0000 0000 0000" inputMode="numeric" autoComplete="cc-number" className="h-12 min-w-0 flex-1 bg-transparent text-sm font-semibold text-ink outline-none" /></div></label><div className="grid grid-cols-2 gap-3"><label><span className="mb-2 block text-xs font-bold text-ink/50">Expiry</span><input value={cardExpiry} onChange={(event) => setCardExpiry(event.target.value.slice(0, 5))} placeholder="MM/YY" inputMode="numeric" autoComplete="cc-exp" className="h-12 w-full rounded-2xl border border-ink/10 px-4 text-sm font-semibold text-ink outline-none focus:border-cargo-yellow" /></label><label><span className="mb-2 block text-xs font-bold text-ink/50">CVV</span><input value={cardCvv} onChange={(event) => setCardCvv(event.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="•••" inputMode="numeric" autoComplete="cc-csc" className="h-12 w-full rounded-2xl border border-ink/10 px-4 text-sm font-semibold text-ink outline-none focus:border-cargo-yellow" /></label></div></div>}
        <button disabled={invalid || submitting} onClick={submitPayment} className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-cargo-yellow px-5 py-3.5 text-sm font-bold text-ink transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45">{submitting ? "Confirming payment…" : `Pay ${amount}`}<ChevronLeft className="size-4 rotate-180" /></button><p className="mt-3 text-center text-[11px] leading-5 text-ink/42">Your payment details are handled securely. New World Cargo does not store your full card number.</p>
      </div>
    </div>
  </div>;
}
