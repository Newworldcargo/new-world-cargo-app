import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, Loader2, Mail, Phone, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthError, AuthLayout, AuthSuccess, BackToSignIn, GoogleAuthButton, OtpInput, PasswordField, PasswordRequirements } from "@/components/auth-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomerApiError } from "@/api/errors";
import { clearVerificationPending, extractRecoveryIdentifier, hasVerificationPending, isStrongPassword, markVerificationPending } from "@/lib/auth-workflow";

const Field = ({ label, value, onChange, type = "text", placeholder, autoComplete, error }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; autoComplete?: string; error?: string }) => <label className="grid gap-2 text-sm font-semibold text-ink"><span>{label}</span><Input value={value} onChange={e => onChange(e.target.value)} type={type} placeholder={placeholder} autoComplete={autoComplete} aria-invalid={Boolean(error)} className="h-12 rounded-xl border-ink/15" />{error && <span className="text-xs font-medium text-red-700" role="alert">{error}</span>}</label>;
const Busy = () => <Loader2 className="mr-2 size-4 animate-spin" />;

export function Login() {
  const [, navigate] = useLocation(); const { login, googleLogin } = useAuth(); const [identifier, setIdentifier] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false); const [googleLoading, setGoogleLoading] = useState(false);
  async function submit(e: React.FormEvent) { e.preventDefault(); setError(""); if (!identifier || !password) { setError("Enter your email or phone number and password."); return; } setLoading(true); const result = await login(identifier, password); setLoading(false); if (!result.ok) { if (result.reason === "unverified") markVerificationPending(); setError(result.reason === "disabled" ? "This account is currently suspended. Please contact support." : result.reason === "unverified" ? "This account is not verified yet. Verify your account to continue." : result.reason === "service" ? "We couldn't sign you in right now. Please try again." : "That email/phone number and password combination isn't correct."); return; } clearVerificationPending(); navigate("/"); }
  async function google() { setGoogleLoading(true); const result = await googleLogin(); setGoogleLoading(false); if (result.ok) navigate("/"); else setError("Google sign-in was not completed. You can try again or use your password."); }
  return <AuthLayout title="Welcome back" eyebrow="Customer access" variant="customer-login"><form onSubmit={submit} className="grid gap-4"><p className="-mt-3 text-sm leading-6 text-ink/60">Sign in to manage your shipments and tracking updates.</p>{error && <AuthError>{error}{error.includes("verified") && <Link href="/verify" className="ml-1 font-bold underline">Verify account</Link>}</AuthError>}<Field label="Email or phone" value={identifier} onChange={setIdentifier} autoComplete="email" placeholder="you@example.com" /><PasswordField label="Password" value={password} onChange={setPassword} /><div className="flex items-center justify-end"><Link href="/forgot-password" className="text-sm font-semibold text-[#b8860b] underline underline-offset-2">Forgot password?</Link></div><Button className="h-12 rounded-xl bg-cargo-yellow font-bold text-ink hover:bg-cargo-yellow/90" disabled={loading}>{loading && <Busy />}Sign in</Button><div className="flex items-center gap-3 text-xs text-ink/35"><span className="h-px flex-1 bg-ink/10" />or<span className="h-px flex-1 bg-ink/10" /></div><GoogleAuthButton onClick={google} loading={googleLoading} /><p className="text-center text-sm text-ink/55">Don't have an account? <Link href="/register" className="font-bold text-ink underline underline-offset-2">Create account</Link></p></form></AuthLayout>;
}

export function Register() {
  const [, navigate] = useLocation(); const { register, googleLogin } = useAuth(); const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "", confirm: "" }); const [accepted, setAccepted] = useState(false); const [error, setError] = useState(""); const [loading, setLoading] = useState(false); const set = (key: keyof typeof form) => (value: string) => setForm(prev => ({ ...prev, [key]: value }));
  async function submit(e: React.FormEvent) { e.preventDefault(); setError(""); if (Object.values(form).some(v => !v)) { setError("Complete all required fields to create your account."); return; } if (!/^[^@]+@[^@]+\.[^@]+$/.test(form.email)) { setError("Enter a valid email address."); return; } if (form.password.length < 8 || !/[A-Z]/.test(form.password) || !/\d/.test(form.password)) { setError("Choose a password that meets the requirements below."); return; } if (form.password !== form.confirm) { setError("Your passwords do not match."); return; } if (!accepted) { setError("Please accept the Terms and Privacy Policy to continue."); return; } setLoading(true); const result = await register({ ...form, password: form.password }); setLoading(false); if (!result.ok) { setError(result.reason === "existing" ? "An account already exists with those details. Try signing in instead." : "We couldn't create your account right now. Please try again."); return; } markVerificationPending(); navigate("/verify"); }
  return <AuthLayout title="Create your account"><form onSubmit={submit} className="grid gap-3"><p className="-mt-3 mb-2 text-sm text-ink/55">Keep every shipment within reach.</p>{error && <AuthError>{error}</AuthError>}<div className="grid gap-3 sm:grid-cols-2"><Field label="First name" value={form.firstName} onChange={set("firstName")} autoComplete="given-name" /><Field label="Last name" value={form.lastName} onChange={set("lastName")} autoComplete="family-name" /></div><Field label="Email address" value={form.email} onChange={set("email")} autoComplete="email" /><Field label="Phone number" value={form.phone} onChange={set("phone")} autoComplete="tel" /><PasswordField label="Password" value={form.password} onChange={set("password")} autoComplete="new-password" /><PasswordRequirements password={form.password} /><PasswordField label="Confirm password" value={form.confirm} onChange={set("confirm")} autoComplete="new-password" /><label className="flex items-start gap-2 py-1 text-xs leading-5 text-ink/60"><input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} className="mt-1 accent-[#FFC83D]" />I agree to the <Link href="/settings/legal/terms" className="font-semibold text-ink underline">Terms</Link> and <Link href="/settings/legal/privacy" className="font-semibold text-ink underline">Privacy Policy</Link>.</label><Button className="h-12 rounded-xl bg-cargo-yellow font-bold text-ink hover:bg-cargo-yellow/90" disabled={loading}>{loading && <Busy />}Create account</Button><GoogleAuthButton onClick={() => { googleLogin().then(() => navigate("/auth/complete-profile")); }} /><p className="text-center text-sm text-ink/55">Already have an account? <Link href="/login" className="font-bold text-ink underline">Sign in</Link></p></form></AuthLayout>;
}

export function Verify() {
  const [, navigate] = useLocation(); const { verify, resendVerification } = useAuth(); const [code, setCode] = useState(""); const [error, setError] = useState(""); const [success, setSuccess] = useState(false); const [loading, setLoading] = useState(false); const [resending, setResending] = useState(false); const [resent, setResent] = useState(false);
  useEffect(() => { if (!hasVerificationPending()) navigate("/login"); }, [navigate]);
  async function submit(e: React.FormEvent) { e.preventDefault(); setError(""); setLoading(true); const result = await verify(code); setLoading(false); if (!result.ok) { setError(result.reason === "incomplete" ? "Enter all six digits." : result.reason === "expired" ? "That code has expired. Request a new code." : result.reason === "attempts" ? "Too many attempts. Request a fresh code to continue." : "That code is not correct. Try again."); return; } clearVerificationPending(); setSuccess(true); setTimeout(() => navigate("/"), 700); }
  async function resend() { setResending(true); const result = await resendVerification(); setResending(false); if (result.ok) { setCode(""); setError(""); setResent(true); } }
  return <AuthLayout title="Verify your account"><form onSubmit={submit} className="grid gap-5"><p className="-mt-3 text-sm leading-6 text-ink/55">Enter the 6-digit verification code sent to your phone or email.</p>{success ? <AuthSuccess title="Account verified">You’re ready to continue.</AuthSuccess> : <>{error && <AuthError>{error}</AuthError>}<div className="grid justify-items-center gap-3"><OtpInput value={code} onChange={setCode} /><button type="button" onClick={resend} disabled={resending} className="inline-flex items-center gap-2 text-sm font-semibold text-ink disabled:opacity-60"><RefreshCw className={`size-4 ${resending ? "animate-spin" : ""}`} />{resending ? "Sending code" : resent ? "Code resent" : "Resend code"}</button></div><Button className="h-12 rounded-xl bg-cargo-yellow font-bold text-ink" disabled={loading}>{loading && <Busy />}Verify</Button><Link href="/login" className="text-center text-sm font-semibold text-ink/55">Change email or phone</Link></>}</form></AuthLayout>;
}

export function ForgotPassword() {
  return <PasswordRecovery />;
}

export function ResetPassword() {
  const initialIdentifier = typeof window === "undefined" ? "" : extractRecoveryIdentifier(window.location.search) || "";
  return <PasswordRecovery initialIdentifier={initialIdentifier} />;
}

function PasswordRecovery({ initialIdentifier = "" }: { initialIdentifier?: string }) {
  const [, navigate] = useLocation();
  const { requestPasswordReset, resetPassword } = useAuth();
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");

  const validIdentifier = () => {
    const value = identifier.trim();
    return value.length > 0 && (!value.includes("@") || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value));
  };

  const sendCode = async () => {
    setError("");
    if (!validIdentifier()) {
      setError("Enter the email address or phone number for your customer account.");
      return false;
    }
    await requestPasswordReset(identifier);
    setCodeSent(true);
    return true;
  };

  const requestCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try { await sendCode(); }
    catch { setError("We could not send a verification code. Please try again."); }
    finally { setLoading(false); }
  };

  const resendCode = async () => {
    setResending(true);
    try { if (await sendCode()) setCode(""); }
    catch { setError("We could not resend the verification code. Please try again."); }
    finally { setResending(false); }
  };

  const savePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!/^\d{6}$/.test(code)) { setError("Enter the six-digit verification code from your message."); return; }
    if (!isStrongPassword(password)) { setError("Choose a password with at least 8 characters, one capital letter, and one number."); return; }
    if (password !== confirmation) { setError("Your passwords do not match."); return; }
    setLoading(true);
    try {
      await resetPassword({ identifier, code, password, passwordConfirmation: confirmation });
      setSuccess(true);
    } catch (caught) {
      if (caught instanceof CustomerApiError && caught.code === "OTP_EXPIRED") setError("That verification code has expired. Request a new code.");
      else if (caught instanceof CustomerApiError && caught.code === "OTP_INVALID") setError("That verification code is not correct. Check it and try again.");
      else setError("We could not update your password. Check the details and try again.");
    } finally { setLoading(false); }
  };

  if (success) return <AuthLayout title="Password updated"><div className="grid gap-5"><AuthSuccess title="Password updated">Your verification code was accepted. You can now sign in with your new password.</AuthSuccess><Button type="button" onClick={() => navigate("/login")} className="h-12 rounded-xl bg-cargo-yellow font-bold text-ink">Sign in</Button></div></AuthLayout>;

  if (!codeSent) return <AuthLayout title="Reset your password"><form onSubmit={requestCode} className="grid gap-5"><p className="-mt-3 text-sm leading-6 text-ink/55">Enter your customer email address or phone number. We will send a six-digit verification code to the contact saved on your account.</p>{error && <AuthError>{error}</AuthError>}<Field label="Email or phone" value={identifier} onChange={setIdentifier} autoComplete="username" placeholder="you@example.com or +260…" /><Button disabled={loading} className="h-12 rounded-xl bg-cargo-yellow font-bold text-ink">{loading && <Busy />}Send verification code</Button><BackToSignIn /></form></AuthLayout>;

  return <AuthLayout title="Enter verification code"><form onSubmit={savePassword} className="grid gap-5"><p className="-mt-3 text-sm leading-6 text-ink/55">Enter the six-digit code sent to the verified contact for <strong>{identifier.trim()}</strong>. The code expires in 10 minutes and can only be used once.</p>{error && <AuthError>{error}</AuthError>}<div className="grid justify-items-center gap-3"><OtpInput value={code} onChange={value => setCode(value.replace(/\D/g, "").slice(0, 6))} /><button type="button" onClick={resendCode} disabled={resending} className="inline-flex items-center gap-2 text-sm font-semibold text-ink disabled:opacity-60"><RefreshCw className={`size-4 ${resending ? "animate-spin" : ""}`} />{resending ? "Sending code" : "Resend code"}</button></div><PasswordField label="New password" value={password} onChange={setPassword} autoComplete="new-password" /><PasswordRequirements password={password} /><PasswordField label="Confirm new password" value={confirmation} onChange={setConfirmation} autoComplete="new-password" /><Button disabled={loading} className="h-12 rounded-xl bg-cargo-yellow font-bold text-ink">{loading && <Busy />}Verify code and update password</Button><button type="button" onClick={() => { setCodeSent(false); setCode(""); setError(""); }} className="text-sm font-semibold text-ink/55 underline underline-offset-2">Use a different email or phone</button><BackToSignIn /></form></AuthLayout>;
}

export function CompleteProfile() {
  const [, navigate] = useLocation(); const { user, updateUser } = useAuth(); const [phone, setPhone] = useState(user?.phone || ""); const [country, setCountry] = useState("Zambia"); const [error, setError] = useState("");
  return <AuthLayout title="Complete your profile"><form onSubmit={e => { e.preventDefault(); if (!phone) { setError("Add a phone number so we can keep you updated."); return; } updateUser({ phone }); navigate("/"); }} className="grid gap-4"><p className="-mt-3 text-sm leading-6 text-ink/55">A few details help New World Cargo keep your delivery updates accurate.</p>{error && <AuthError>{error}</AuthError>}<Field label="Phone number" value={phone} onChange={setPhone} autoComplete="tel" /><Field label="Country" value={country} onChange={setCountry} /><Button className="h-12 rounded-xl bg-cargo-yellow font-bold text-ink">Continue</Button></form></AuthLayout>;
}

export function SessionExpired() { const [, navigate] = useLocation(); return <AuthLayout title="Your session has expired"><div className="grid gap-5"><p className="text-sm leading-6 text-ink/60">For your security, please sign in again. We’ll take you back to your customer workspace.</p><Button onClick={() => navigate("/login?returnTo=/")} className="h-12 rounded-xl bg-cargo-yellow font-bold text-ink">Sign in again <ArrowRight className="ml-2 size-4" /></Button></div></AuthLayout>; }
