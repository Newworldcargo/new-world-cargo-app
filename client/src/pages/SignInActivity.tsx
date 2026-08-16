import { ArrowLeft, Check, Laptop, LogOut, MapPin, ShieldCheck, Smartphone } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

const activity = [
  { id: "current", device: "Chrome on Windows", detail: "Lusaka, Zambia · Current session", time: "Active now", current: true, icon: Laptop },
  { id: "phone", device: "New World Cargo mobile browser", detail: "Lusaka, Zambia · Mobile session", time: "Yesterday · 18:42", icon: Smartphone },
  { id: "safari", device: "Safari on iPhone", detail: "Ndola, Zambia · Recognized device", time: "12 Aug 2026 · 09:16", icon: Smartphone },
];

export default function SignInActivity() {
  const [, navigate] = useLocation();
  const [trusted, setTrusted] = useState(true);
  const [signedOut, setSignedOut] = useState<string[]>([]);

  return <div className="mx-auto max-w-3xl text-ink">
    <button onClick={() => navigate("/settings/security")} className="flex items-center gap-2 text-sm font-bold text-ink/55 transition hover:text-ink"><ArrowLeft className="size-4" /> Back to security</button>
    <div className="mt-7 flex items-start gap-4"><span className="grid size-12 place-items-center rounded-2xl bg-cargo-yellow/18 text-ink"><ShieldCheck className="size-5" /></span><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-cargo-yellow">Security</p><h1 className="mt-1 font-heading text-3xl font-extrabold tracking-tight">Sign-in activity</h1><p className="mt-2 max-w-xl text-sm leading-6 text-ink/55">Review where your account is signed in and remove sessions you do not recognize.</p></div></div>
    <div className="relative mt-6 overflow-hidden rounded-2xl border border-ink/10 bg-[#f7f8fb] px-4 py-3"><div className="relative flex items-center gap-3"><span className="size-2 rounded-full bg-cargo-yellow" /><span className="h-px min-w-7 flex-1 bg-cargo-yellow" /><span className="size-3 rounded-full border-2 border-cargo-yellow bg-white shadow-[0_0_0_4px_rgba(255,200,61,0.14)]" /><span className="h-px min-w-7 flex-1 border-t border-dashed border-ink/20" /><span className="size-2 rounded-full bg-ink/25" /><span className="ml-1 whitespace-nowrap text-[10px] font-extrabold uppercase tracking-[0.15em] text-ink">Account protection</span></div></div>
    <div className="mt-6 space-y-4">
      <section className="overflow-hidden rounded-[26px] border border-ink/10 bg-white"><div className="flex items-start gap-3 border-b border-ink/8 p-5"><span className="grid size-10 place-items-center rounded-2xl bg-cargo-yellow text-ink"><Check className="size-4" /></span><div><p className="text-sm font-bold">Your account is protected</p><p className="mt-1 text-xs leading-5 text-ink/55">If you see a session you do not recognize, sign it out and change your password.</p></div></div>{activity.map((item, index) => { const Icon = item.icon; const removed = signedOut.includes(item.id); return <div key={item.id} className={`flex gap-3 p-5 ${index ? "border-t border-ink/8" : ""} ${removed ? "opacity-50" : ""}`}><span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-cargo-yellow/15 text-ink"><Icon className="size-4" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-bold">{item.device}</p>{item.current && !removed && <span className="rounded-full bg-cargo-yellow/30 px-2 py-0.5 text-[9px] font-bold text-ink">Current</span>}</div><p className="mt-1 flex items-center gap-1 text-xs text-ink/50"><MapPin className="size-3" />{item.detail}</p><p className="mt-1 text-[11px] font-semibold text-ink/40">{removed ? "Signed out" : item.time}</p></div>{!item.current && !removed && <Button variant="outline" onClick={() => setSignedOut(current => [...current, item.id])} className="h-9 shrink-0 rounded-xl px-3 text-xs font-bold"><LogOut className="mr-1 size-3.5" />Sign out</Button>}</div>; })}</section>
      <section className="rounded-[26px] border border-ink/10 bg-white p-5"><div className="flex items-center justify-between gap-4"><div><p className="text-sm font-bold">Trust this device</p><p className="mt-1 text-xs leading-5 text-ink/55">Skip extra verification on this browser for 30 days.</p></div><button onClick={() => setTrusted(!trusted)} className={`relative h-7 w-12 shrink-0 rounded-full transition ${trusted ? "bg-cargo-yellow" : "bg-ink/15"}`} aria-pressed={trusted}><span className={`absolute top-1 size-5 rounded-full bg-white shadow-sm transition ${trusted ? "left-6" : "left-1"}`} /></button></div></section>
      <button onClick={() => navigate("/reset-password")} className="flex w-full items-center justify-between rounded-2xl border border-ink/10 bg-white px-5 py-4 text-left hover:bg-ink/[0.025]"><span><span className="block text-sm font-bold">Change password</span><span className="mt-1 block text-xs text-ink/50">Use a new password if you notice anything unusual.</span></span><ArrowLeft className="size-4 rotate-180 text-ink/35" /></button>
    </div>
  </div>;
}
