// New World Cargo style reminder: Poppins, white canvas, Cargo Yellow actions, navy route accents, mobile-first.

import type { LucideIcon } from "lucide-react";
import { Bell, ChevronDown, CircleHelp, House, LogOut, Package, Plus, ReceiptText, Settings2, UserRound, X } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { BrandMark } from "./BrandMark";

type NavItem = { label: string; href: string; icon: LucideIcon };

const desktopNavItems: NavItem[] = [
  { label: "Home", href: "/", icon: House },
  { label: "Send", href: "/send", icon: Plus },
  { label: "Shipments", href: "/shipments", icon: Package },
  { label: "Invoices", href: "/invoices", icon: ReceiptText },
  { label: "Settings", href: "/settings", icon: Settings2 },
];

const mobileNavItems: NavItem[] = [
  { label: "Home", href: "/", icon: House },
  { label: "Shipments", href: "/shipments", icon: Package },
  { label: "Send", href: "/send", icon: Plus },
  { label: "Invoices", href: "/invoices", icon: ReceiptText },
  { label: "Settings", href: "/settings", icon: Settings2 },
];

function NavLink({ item, active, mobile = false }: { item: NavItem; active: boolean; mobile?: boolean }) {
  const [, navigate] = useLocation();
  const Icon = item.icon;
  return (
    <button
      onClick={() => navigate(item.href)}
      className={mobile
        ? `flex min-w-14 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-semibold transition duration-200 ${active ? "bg-brand-secondary/80 text-cargo-yellow" : "text-white/65 hover:text-white"}`
        : `group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition duration-200 ${active ? "bg-cargo-yellow text-ink shadow-[0_10px_24px_rgba(255,200,61,0.2)]" : "text-white/55 hover:bg-white/6 hover:text-white"}`}
      aria-current={active ? "page" : undefined}
    >
      <Icon className={mobile ? "size-5" : "size-[18px]"} strokeWidth={active ? 2.4 : 1.8} />
      <span>{item.label}</span>

    </button>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const [supportOpen, setSupportOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const activeHref = location === "/" ? "/" : `/${location.split("/")[1]}`;

  return (
    <div className="nwc-light min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="sticky top-0 hidden h-screen w-[236px] shrink-0 flex-col border-r border-ink/10 bg-white px-5 py-7 lg:flex">
          <BrandMark />
          <div className="mt-14 flex flex-1 flex-col gap-1">
            {desktopNavItems.map((item) => <NavLink key={item.href} item={item} active={activeHref === item.href} />)}
            <div className="my-6 h-px bg-white/8" />
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.22em] text-white/25">Shortcuts</p>
            <button onClick={() => navigate("/quote")} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold text-white/55 transition hover:bg-white/6 hover:text-white">
              <ReceiptText className="size-[18px]" strokeWidth={1.8} /> Get a quote
            </button>
            <button onClick={() => setSupportOpen(true)} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold text-white/55 transition hover:bg-white/6 hover:text-white">
              <CircleHelp className="size-[18px]" strokeWidth={1.8} /> Support
            </button>
          </div>
          <div className="mt-8">
            <button onClick={() => { navigate("/"); toast("You have been signed out."); }} className="flex w-full items-center gap-3 rounded-2xl border border-ink/10 bg-white p-3 text-left text-ink transition hover:border-cargo-yellow hover:bg-cargo-yellow/10">
              <div className="grid size-9 place-items-center rounded-xl bg-cargo-yellow text-ink"><LogOut className="size-4" /></div>
              <p className="text-xs font-bold">Log out</p>
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 pb-24 lg:pb-0">
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/8 bg-background/90 px-4 py-4 backdrop-blur-xl sm:px-8 lg:px-12">
            <div className="lg:hidden"><BrandMark compact /></div>
            <div className="hidden items-center gap-3 lg:flex"><div className="size-2 rounded-full bg-cargo-yellow shadow-[0_0_0_5px_rgba(255,200,61,0.12)]" /><span className="text-xs font-medium text-white/45">All systems operational</span></div>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={() => navigate("/notifications")} className="relative grid size-10 place-items-center rounded-full border border-white/10 text-white/70 transition hover:border-white/25 hover:text-white" aria-label="Open notifications">
                <Bell className="size-[18px]" strokeWidth={1.8} /><span className="absolute right-2.5 top-2 size-1.5 rounded-full bg-cargo-yellow" />
              </button>
              <div className="relative hidden sm:block">
                <button onClick={() => setProfileOpen((open) => !open)} className="flex items-center gap-2.5 rounded-full border border-white/10 py-1.5 pl-1.5 pr-2.5 transition hover:border-white/25" aria-haspopup="menu" aria-expanded={profileOpen}>
                  <div className="grid size-7 place-items-center rounded-full bg-cargo-yellow text-xs font-bold text-ink">AM</div>
                  <span className="text-xs font-semibold text-white/75">Amina</span>
                  <ChevronDown className={`size-3.5 text-white/45 transition ${profileOpen ? "rotate-180" : ""}`} />
                </button>
                {profileOpen && (
                  <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-52 rounded-2xl border border-ink/10 bg-white p-2 shadow-xl" role="menu">
                    <button onClick={() => { setProfileOpen(false); navigate("/settings/account"); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-ink transition hover:bg-ink/5" role="menuitem">
                      <UserRound className="size-4 text-ink/55" /> Profile
                    </button>
                    <button onClick={() => { setProfileOpen(false); navigate("/settings"); toast("Settings opened."); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-ink transition hover:bg-ink/5" role="menuitem">
                      <Settings2 className="size-4 text-ink/55" /> Settings
                    </button>
                    <div className="my-1 h-px bg-ink/8" />
                    <button onClick={() => { setProfileOpen(false); navigate("/"); toast("You have been signed out."); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-ink transition hover:bg-cargo-yellow/15" role="menuitem">
                      <LogOut className="size-4" /> Log out
                    </button>
                  </div>
                )}
              </div>
              <button onClick={() => setSupportOpen(true)} className="grid size-10 place-items-center rounded-full border border-white/10 text-white/70 transition hover:border-white/25 hover:text-white lg:hidden" aria-label="Open support"><CircleHelp className="size-[18px]" strokeWidth={1.8} /></button>
            </div>
          </header>
          <div className="px-4 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10">{children}</div>
        </main>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-[26px] border border-white/10 bg-brand-secondary p-2 shadow-2xl backdrop-blur-xl lg:hidden" aria-label="Primary navigation">
        {mobileNavItems.map((item) => <NavLink key={item.href} item={item} active={activeHref === item.href} mobile />)}
      </nav>

      {supportOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-3 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-label="Customer support">
          <div className="w-full max-w-md rounded-[30px] border border-white/10 bg-[#222]/95 p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-cargo-yellow">Support center</p><h2 className="mt-2 font-heading text-2xl font-bold">We’re here to help.</h2></div><button onClick={() => setSupportOpen(false)} className="grid size-9 place-items-center rounded-full bg-white/8 text-white/60 hover:text-white" aria-label="Close support"><X className="size-4" /></button></div>
            <p className="mt-4 text-sm leading-6 text-white/55">Talk to the New World Cargo team about a shipment, delivery exception, or quote.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2"><a href="tel:+260763297287" className="rounded-2xl bg-cargo-yellow px-4 py-3 text-center text-sm font-bold text-ink transition hover:brightness-105">Call +260 763 297 287</a><a href="mailto:info@newworldcargo.com" className="rounded-2xl border border-white/15 px-4 py-3 text-center text-sm font-bold text-white transition hover:border-white/30">Email support</a></div>
            <p className="mt-5 text-center text-[11px] text-white/35">24/7 support · Lusaka, Zambia</p>
          </div>
        </div>
      )}
    </div>
  );
}
