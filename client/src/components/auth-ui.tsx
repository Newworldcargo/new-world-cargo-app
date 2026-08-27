import { ArrowLeft, Check, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { BrandMark } from "./BrandMark";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "./ui/input-otp";

export function AuthLayout({
  children,
  title,
  eyebrow = "New World Cargo",
  variant = "default",
}: {
  children: React.ReactNode;
  title?: string;
  eyebrow?: string;
  variant?: "default" | "customer-login";
}) {
  if (variant === "customer-login") {
    return <div className="nwc-light relative min-h-screen overflow-hidden bg-[#08233a] px-4 py-6 text-white sm:px-6 sm:py-10">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://www.newworldcargo.com/images/bg.webp')" }} />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(1,17,30,0.45),rgba(1,17,30,0.82))]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-md flex-col">
        <div className="mb-8 flex items-start justify-between gap-4">
          <Link href="/login" aria-label="New World Cargo home" className="inline-flex">
            <img src="https://www.newworldcargo.com/images/white-logo.png" alt="New World Cargo" className="h-12 w-auto object-contain sm:h-14" />
          </Link>
          <Link href="/shipments/tracking" className="shrink-0 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/15">Track shipment</Link>
        </div>
        <main className="my-auto rounded-[30px] border border-ink/10 bg-white p-5 text-ink shadow-[0_20px_60px_rgba(1,38,66,0.12)] sm:p-8">
          {title && <div className="mb-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cargo-yellow">{eyebrow}</p>
            <h1 className="mt-2 font-heading text-3xl font-bold text-ink">{title}</h1>
          </div>}
          {children}
        </main>
        <p className="mt-6 text-center text-[11px] leading-5 text-white/70">By continuing, you agree to our <Link href="/settings/legal/terms" className="font-semibold text-white underline underline-offset-2">Terms</Link> and <Link href="/settings/legal/privacy" className="font-semibold text-white underline underline-offset-2">Privacy Policy</Link>.</p>
      </div>
    </div>;
  }

  return <div className="nwc-light min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 sm:py-10"><div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-md flex-col"><div className="mb-8 flex items-center justify-between gap-4"><Link href="/login" aria-label="New World Cargo home"><BrandMark compact /></Link><Link href="/shipments/tracking" className="shrink-0 text-xs font-semibold text-ink underline decoration-cargo-yellow underline-offset-4">Track shipment</Link></div><main className="my-auto rounded-[30px] border border-ink/10 bg-white p-5 shadow-[0_20px_60px_rgba(1,38,66,0.08)] sm:p-8">{title && <div className="mb-7"><p className="text-xs font-bold uppercase tracking-[0.18em] text-cargo-yellow">{eyebrow}</p><h1 className="mt-2 font-heading text-3xl font-bold text-ink">{title}</h1></div>}{children}</main><p className="mt-6 text-center text-[11px] leading-5 text-ink/45">By continuing, you agree to our <Link href="/settings/legal/terms" className="font-semibold text-ink underline underline-offset-2">Terms</Link> and <Link href="/settings/legal/privacy" className="font-semibold text-ink underline underline-offset-2">Privacy Policy</Link>.</p></div></div>;
}

export function PasswordField({ label, value, onChange, autoComplete = "current-password", error }: { label: string; value: string; onChange: (value: string) => void; autoComplete?: string; error?: string }) {
  const [visible, setVisible] = useState(false);
  return <label className="grid gap-2 text-sm font-semibold text-ink"><span>{label}</span><span className="relative"><Input type={visible ? "text" : "password"} value={value} onChange={e => onChange(e.target.value)} autoComplete={autoComplete} aria-invalid={Boolean(error)} className="h-12 rounded-xl border-ink/15 pr-12" /><button type="button" onClick={() => setVisible(v => !v)} className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-ink/45 hover:text-ink" aria-label={visible ? "Hide password" : "Show password"}>{visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></span>{error && <span className="text-xs font-medium text-red-700" role="alert">{error}</span>}</label>;
}

export function PasswordRequirements({ password }: { password: string }) {
  const checks = [{ label: "At least 8 characters", ok: password.length >= 8 }, { label: "One uppercase letter", ok: /[A-Z]/.test(password) }, { label: "One number", ok: /\d/.test(password) }];
  return <div className="grid gap-1 rounded-xl bg-ink/[0.04] p-3 text-xs text-ink/55">{checks.map(check => <div key={check.label} className={`flex items-center gap-2 ${check.ok ? "text-ink" : ""}`}><Check className={`size-3.5 ${check.ok ? "text-cargo-yellow" : "text-ink/25"}`} />{check.label}</div>)}</div>;
}

export function GoogleAuthButton({ onClick, loading }: { onClick: () => void; loading?: boolean }) {
  return <Button type="button" variant="outline" onClick={onClick} disabled={loading} className="h-12 w-full rounded-xl border-ink/15 bg-white font-semibold text-ink"><span className="mr-2 grid size-5 place-items-center rounded-full border border-ink/15 text-xs font-bold">G</span>{loading ? "Connecting…" : "Continue with Google"}</Button>;
}

export function AuthError({ children }: { children: React.ReactNode }) { return <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-800" role="alert">{children}</div>; }
export function AuthSuccess({ title, children }: { title: string; children: React.ReactNode }) { return <div className="grid gap-3 rounded-2xl border border-cargo-yellow/50 bg-cargo-yellow/10 p-4"><div className="flex items-center gap-2 font-bold text-ink"><ShieldCheck className="size-5 text-cargo-yellow" />{title}</div><div className="text-sm leading-6 text-ink/65">{children}</div></div>; }
export function OtpInput({ value, onChange }: { value: string; onChange: (value: string) => void }) { return <InputOTP maxLength={6} value={value} onChange={onChange} aria-label="Six digit verification code"><InputOTPGroup>{Array.from({ length: 6 }, (_, index) => <InputOTPSlot key={index} index={index} />)}</InputOTPGroup></InputOTP>; }
export function BackToSignIn() { return <Link href="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-ink/60 hover:text-ink"><ArrowLeft className="size-4" />Back to sign in</Link>; }
