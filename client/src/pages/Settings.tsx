// New World Cargo style reminder: light, mobile-first command center with compact task cards, Cargo Yellow actions, and a visible route-control motif.

import { Bell, Camera, ChevronRight, CircleUserRound, CreditCard, FileText, MapPin, ShieldCheck, UsersRound, WalletCards } from "lucide-react";
import { useLocation } from "wouter";

type SettingsLink = { title: string; detail: string; href: string; icon: typeof CircleUserRound; accent: string };

const groups: { label: string; links: SettingsLink[] }[] = [
  { label: "Your details", links: [
    { title: "Account details", detail: "Profile, contact, and account information", href: "/settings/account", icon: CircleUserRound, accent: "bg-cargo-yellow/15 text-ink" },
    { title: "Profile photo", detail: "Choose or update your account photo", href: "/settings/profile-photo", icon: Camera, accent: "bg-cargo-yellow/18 text-ink" },
    { title: "Saved addresses", detail: "Pickup and delivery locations", href: "/settings/addresses", icon: MapPin, accent: "bg-cargo-yellow/18 text-ink" },
    { title: "Saved recipients", detail: "People you send to often", href: "/settings/recipients", icon: UsersRound, accent: "bg-cargo-yellow/15 text-ink" },
  ] },
  { label: "Preferences & payments", links: [
    { title: "Notifications", detail: "Shipment updates and delivery alerts", href: "/settings/notifications", icon: Bell, accent: "bg-cargo-yellow/15 text-ink" },
    { title: "Payment methods", detail: "Mobile money, cards, and balance", href: "/settings/payment-methods", icon: CreditCard, accent: "bg-cargo-yellow/18 text-ink" },
    { title: "Security", detail: "Password and verified contact details", href: "/settings/security", icon: ShieldCheck, accent: "bg-cargo-yellow/15 text-ink" },
    { title: "Receipts & billing", detail: "Invoices, payments, and receipts", href: "/settings/billing", icon: WalletCards, accent: "bg-cargo-yellow/15 text-ink" },
  ] },
  { label: "Legal", links: [
    { title: "Privacy & policies", detail: "Privacy, terms, returns, shipping, and customer responsibilities", href: "/settings/legal", icon: FileText, accent: "bg-cargo-yellow/15 text-ink" },
  ] },
];

export default function Settings() {
  const [, navigate] = useLocation();
  return <div className="mx-auto max-w-3xl text-ink">
    <div><h1 className="font-heading text-3xl font-extrabold tracking-tight">Settings</h1><p className="mt-2 max-w-xl text-sm leading-6 text-ink/55">Manage your details, delivery preferences, payment options, and account protection one thing at a time.</p></div>
    <div className="mt-7 space-y-8">{groups.map((group) => <section key={group.label}><p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-ink/40">{group.label}</p><div className="overflow-hidden rounded-[26px] border border-ink/10 bg-white">{group.links.map((item, index) => { const Icon = item.icon; return <button key={item.href} onClick={() => navigate(item.href)} className={`flex w-full items-center gap-3.5 px-4 py-4 text-left transition hover:bg-ink/[0.025] sm:px-5 ${index ? "border-t border-ink/8" : ""}`}><span className={`grid size-10 shrink-0 place-items-center rounded-2xl ${item.accent}`}><Icon className="size-4.5" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-bold">{item.title}</span><span className="mt-1 block text-xs text-ink/50">{item.detail}</span></span><ChevronRight className="size-4 shrink-0 text-ink/35" /></button>; })}</div></section>)}</div>
  </div>;
}
