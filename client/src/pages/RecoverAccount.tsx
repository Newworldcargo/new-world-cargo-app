import { useRef, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { AuthError, AuthLayout, AuthSuccess, OtpInput } from "@/components/auth-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/api/http";
import { CustomerApiError } from "@/api/errors";

const pendingKey = "nwc_account_recovery_pending";
function pendingReference() {
  try { return sessionStorage.getItem(pendingKey) || ""; } catch { return ""; }
}

export default function RecoverAccount() {
  const emailRequired = new URLSearchParams(window.location.search).get("reason") === "email-required";
  const [form, setForm] = useState({ name: "", email: "", phone: "", shipmentReference: "", detail: "" });
  const [reference, setReference] = useState(pendingReference);
  const [code, setCode] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const inFlight = useRef(false);
  const change = (field: keyof typeof form, value: string) => {
    setForm(current => ({ ...current, [field]: value }));
    setErrors(current => ({ ...current, [field]: [] }));
  };
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError(""); setErrors({});
    try {
      if (reference) {
        await apiRequest("/auth/account-recovery/confirm", { method: "POST", body: { reference, code } });
        setSubmitted(true);
        try { sessionStorage.removeItem(pendingKey); } catch { /* Storage can be disabled. */ }
      } else {
        const response = await apiRequest<{ reference: string }>("/auth/account-recovery", { method: "POST", body: form });
        setReference(response.reference);
        try { sessionStorage.setItem(pendingKey, response.reference); } catch { /* Keep the current form usable. */ }
      }
    } catch (caught) {
      setError(caught instanceof CustomerApiError ? caught.message : "We could not complete your request. Please try again.");
      if (caught instanceof CustomerApiError) setErrors(caught.fieldErrors || {});
    } finally { inFlight.current = false; setBusy(false); }
  }
  function restart() {
    setReference(""); setCode(""); setError("");
    try { sessionStorage.removeItem(pendingKey); } catch { /* No stored state to clear. */ }
  }
  if (submitted) return <AuthLayout title="Request received"><div className="grid gap-5">
    <AuthSuccess title="Your request is awaiting review">Our team will contact you at the email you confirmed. Your shipment history stays protected while we check ownership.</AuthSuccess>
    <p className="text-sm text-ink/70">Reference <span className="mt-1 block break-all font-mono text-xs text-ink">{reference}</span></p>
    <Link href="/login" className="inline-flex min-h-11 items-center gap-2 font-semibold text-ink"><ArrowLeft className="size-4" />Return to sign in</Link>
  </div></AuthLayout>;
  return <AuthLayout title={reference ? "Confirm your email" : emailRequired ? "Add your email" : "Find your existing account"}>
    <form onSubmit={submit} className="grid gap-4">
      <p className="text-sm leading-6 text-ink/70">{reference
        ? "Enter the six-digit code from your email. It expires after 10 minutes. This confirms your contact email, not ownership of a shipment."
        : emailRequired ? "Your account needs a usable email address. Enter an email you can access so our team can help restore your customer account."
        : "Already shipped with us, but never signed in or no longer have access to your email? Request help with your existing account."}</p>
      {error && <AuthError>{error}</AuthError>}
      {reference ? <div className="grid justify-items-center gap-3"><OtpInput value={code} onChange={setCode} /><button type="button" disabled={busy} onClick={restart} className="min-h-11 text-sm font-semibold text-ink underline">Change details or request a new code</button></div> : <>
        {([['name', 'Full name', 'text', 'name'], ['email', 'Email you can access', 'email', 'email'], ['phone', 'Phone used for your shipments', 'tel', 'tel'], ['shipmentReference', 'Shipment or invoice reference (optional)', 'text', 'off']] as const).map(([field, label, type, autoComplete]) => <label key={field} className="grid gap-2 text-sm font-semibold text-ink">{label}<Input type={type} autoComplete={autoComplete} required={field !== 'shipmentReference'} maxLength={field === 'phone' ? 30 : field === 'shipmentReference' ? 100 : field === 'name' ? 160 : 255} value={form[field]} onChange={event => change(field, event.target.value)} aria-invalid={Boolean(errors[field]?.length)} aria-describedby={errors[field]?.length ? `error-${field}` : undefined} className="h-12" />{errors[field]?.length ? <span id={`error-${field}`} role="alert" className="text-xs text-red-700">{errors[field][0]}</span> : null}</label>)}
        <label className="grid gap-2 text-sm font-semibold text-ink">What do you need help with?<textarea required minLength={10} maxLength={2000} rows={3} value={form.detail} onChange={event => change('detail', event.target.value)} className="w-full rounded-md border border-ink/20 bg-white p-3 font-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink" placeholder="For example: I booked at the branch and have never used an email to sign in." aria-invalid={Boolean(errors.detail?.length)} />{errors.detail?.length ? <span role="alert" className="text-xs text-red-700">{errors.detail[0]}</span> : null}</label>
      </>}
      <Button disabled={busy || (Boolean(reference) && !/^\d{6}$/.test(code))} className="h-12 bg-cargo-yellow font-bold text-ink hover:bg-cargo-yellow/90">{busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ShieldCheck className="mr-2 size-4" />}{reference ? "Confirm email and request review" : "Send email code"}</Button>
      <p className="text-xs leading-5 text-ink/65">Do not include passwords, payment card details, or verification codes in your request.</p>
      <div className="flex flex-wrap justify-between gap-3 text-sm font-semibold text-ink"><Link href="/login" className="min-h-11 py-3 underline">Sign in</Link><Link href="/forgot-password" className="min-h-11 py-3 underline">Reset password</Link></div>
    </form>
  </AuthLayout>;
}
