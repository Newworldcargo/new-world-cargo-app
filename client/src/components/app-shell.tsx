// New World Cargo style reminder: Poppins, white canvas, Cargo Yellow actions, navy route accents, mobile-first.

import type { LucideIcon } from "lucide-react";
import { Bell, ChevronDown, CircleHelp, House, LogOut, Package, PanelLeftClose, PanelLeftOpen, Plus, ReceiptText, Settings2, UserRound, X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { feedback } from "@/lib/feedback";
import { useAuth } from "@/contexts/AuthContext";
import { isPrimaryMobileTabRoute } from "@/lib/primary-mobile-navigation";
import { BrandMark } from "./BrandMark";
import { MobileBottomNavigation } from "./mobile-bottom-navigation";

type NavItem = { label: string; href: string; icon: LucideIcon };

const desktopNavItems: NavItem[] = [
  { label: "Home", href: "/", icon: House },
  { label: "Send", href: "/send", icon: Plus },
  { label: "Shipments", href: "/shipments", icon: Package },
  { label: "Invoices", href: "/invoices", icon: ReceiptText },
  { label: "Settings", href: "/settings", icon: Settings2 },
];

function NavLink({ item, active, pageActive, collapsed, onNavigate }: { item: NavItem; active: boolean; pageActive: boolean; collapsed: boolean; onNavigate: (href: string) => void }) {
  const Icon = item.icon;
  return (
    <button
      onClick={() => onNavigate(item.href)}
      className={`group flex w-full items-center rounded-2xl py-3 text-sm font-semibold transition duration-200 ${collapsed ? "justify-center px-2" : "gap-3 px-3"} ${active ? "bg-cargo-yellow text-ink shadow-[0_10px_24px_rgba(255,200,61,0.2)]" : "text-white/55 hover:bg-white/6 hover:text-white"}`}
      aria-current={pageActive ? "page" : undefined}
      aria-label={collapsed ? item.label : undefined}
      title={collapsed ? item.label : undefined}
    >
      <Icon className="size-[18px]" strokeWidth={active ? 2.4 : 1.8} />
      <span className={collapsed ? "sr-only" : undefined}>{item.label}</span>
    </button>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const [supportOpen, setSupportOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [scrollActiveHref, setScrollActiveHref] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLElement | null>(null);
  const sidebarScrollPositions = useRef<Record<string, number>>({});
  const { user, logout } = useAuth();
  const routeActiveHref = location === "/" ? "/" : `/${location.split("/")[1]}`;
  const activeHref = scrollActiveHref ?? routeActiveHref;
  const showMobileNavigation = isPrimaryMobileTabRoute(location);
  const handleLogout = () => { logout(); feedback.success("Signed out successfully."); navigate("/login"); };
  const navigateWithSidebarState = (href: string) => { navigate(href); };

  useLayoutEffect(() => {
    const sidebar = sidebarRef.current;
    if (sidebar) sidebar.scrollTop = sidebarScrollPositions.current[location] ?? 0;
    return () => { sidebarScrollPositions.current[location] = sidebar?.scrollTop ?? 0; };
  }, [location]);

  useEffect(() => {
    const wideScreen = window.matchMedia("(min-width: 1280px)");
    const expandOnWideScreens = () => { if (wideScreen.matches) setSidebarCollapsed(false); };
    expandOnWideScreens();
    wideScreen.addEventListener("change", expandOnWideScreens);
    return () => wideScreen.removeEventListener("change", expandOnWideScreens);
  }, []);

  useEffect(() => {
    setScrollActiveHref(null);
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-sidebar-section]")).filter((section) => desktopNavItems.some((item) => item.href === section.dataset.sidebarSection));
    if (!sections.length) return;

    let frame: number | null = null;
    const updateVisibleSection = () => {
      frame = null;
      const marker = window.innerHeight * 0.24;
      const visibleSection = sections.find((section) => {
        const bounds = section.getBoundingClientRect();
        return bounds.top <= marker && bounds.bottom >= marker;
      }) ?? sections.find((section) => section.getBoundingClientRect().top > marker);
      setScrollActiveHref(visibleSection?.dataset.sidebarSection ?? null);
    };
    const scheduleVisibleSectionUpdate = () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateVisibleSection);
    };

    scheduleVisibleSectionUpdate();
    window.addEventListener("scroll", scheduleVisibleSectionUpdate, { passive: true });
    window.addEventListener("resize", scheduleVisibleSectionUpdate);
    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleVisibleSectionUpdate);
      window.removeEventListener("resize", scheduleVisibleSectionUpdate);
    };
  }, [location]);

  return (
    <div className="nwc-light min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className={`mx-auto min-h-screen max-w-[1600px] transition-[padding] duration-200 ${sidebarCollapsed ? "lg:pl-[76px]" : "lg:pl-[236px]"}`}>
        <aside ref={sidebarRef} className={`fixed inset-y-0 left-0 z-40 hidden h-screen flex-col overflow-y-auto overscroll-contain border-r border-ink/10 bg-white py-7 transition-[width,padding] duration-200 lg:flex ${sidebarCollapsed ? "w-[76px] px-3" : "w-[236px] px-5"}`}>
          <div className={sidebarCollapsed ? "grid place-items-center" : undefined}>{sidebarCollapsed ? <div className="grid size-10 place-items-center rounded-2xl bg-cargo-yellow text-xs font-extrabold text-ink" aria-label="New World Cargo">NW</div> : <BrandMark />}</div>
          <button
            type="button"
            onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
            className="absolute -right-3 top-8 z-10 hidden size-7 place-items-center rounded-full border border-ink/15 bg-white text-ink shadow-sm transition hover:border-cargo-yellow hover:bg-cargo-yellow lg:grid xl:hidden"
            aria-label={sidebarCollapsed ? "Expand navigation" : "Collapse navigation"}
            aria-pressed={sidebarCollapsed}
            title={sidebarCollapsed ? "Expand navigation" : "Collapse navigation"}
          >
            {sidebarCollapsed ? <PanelLeftOpen className="size-3.5" /> : <PanelLeftClose className="size-3.5" />}
          </button>
          <div className={`mt-14 flex flex-1 flex-col gap-1 ${sidebarCollapsed ? "items-center" : ""}`}>
            {desktopNavItems.map((item) => <NavLink key={item.href} item={item} active={activeHref === item.href} pageActive={routeActiveHref === item.href} collapsed={sidebarCollapsed} onNavigate={navigateWithSidebarState} />)}
            <div className="my-6 h-px bg-white/8" />
            <p className={sidebarCollapsed ? "sr-only" : "mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.22em] text-white/25"}>Shortcuts</p>
            <button onClick={() => navigateWithSidebarState("/quote")} className={`flex w-full items-center rounded-2xl py-3 text-left text-sm font-semibold text-white/55 transition hover:bg-white/6 hover:text-white ${sidebarCollapsed ? "justify-center px-2" : "gap-3 px-3"}`} aria-label={sidebarCollapsed ? "Get a quote" : undefined} title={sidebarCollapsed ? "Get a quote" : undefined}>
              <ReceiptText className="size-[18px]" strokeWidth={1.8} /> <span className={sidebarCollapsed ? "sr-only" : undefined}>Get a quote</span>
            </button>
            <button onClick={() => setSupportOpen(true)} className={`flex w-full items-center rounded-2xl py-3 text-left text-sm font-semibold text-white/55 transition hover:bg-white/6 hover:text-white ${sidebarCollapsed ? "justify-center px-2" : "gap-3 px-3"}`} aria-label={sidebarCollapsed ? "Support" : undefined} title={sidebarCollapsed ? "Support" : undefined}>
              <CircleHelp className="size-[18px]" strokeWidth={1.8} /> <span className={sidebarCollapsed ? "sr-only" : undefined}>Support</span>
            </button>
          </div>
          <div className="mt-8">
            <button onClick={() => { handleLogout(); }} className={`flex w-full items-center rounded-2xl border border-ink/10 bg-white text-left text-ink transition hover:border-cargo-yellow hover:bg-cargo-yellow/10 ${sidebarCollapsed ? "justify-center p-2" : "gap-3 p-3"}`} aria-label={sidebarCollapsed ? "Log out" : undefined} title={sidebarCollapsed ? "Log out" : undefined}>
              <div className="grid size-9 place-items-center rounded-xl bg-cargo-yellow text-ink"><LogOut className="size-4" /></div>
              <p className={sidebarCollapsed ? "sr-only" : "text-xs font-bold"}>Log out</p>
            </button>
          </div>
        </aside>

        <main className={`min-w-0 flex-1 ${showMobileNavigation ? "pb-32" : "pb-6"} lg:pb-0`}>
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/8 bg-background/90 px-4 py-4 backdrop-blur-xl sm:px-8 lg:px-12">
            <div className="lg:hidden"><BrandMark compact /></div>
            <div className="hidden items-center gap-3 lg:flex"><div className="size-2 rounded-full bg-cargo-yellow shadow-[0_0_0_5px_rgba(255,200,61,0.12)]" /><span className="text-xs font-medium text-white/45">All systems operational</span></div>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={() => navigate("/notifications")} className="relative grid size-10 place-items-center rounded-full border border-white/10 text-white/70 transition hover:border-white/25 hover:text-white" aria-label="Open notifications">
                <Bell className="size-[18px]" strokeWidth={1.8} /><span className="absolute right-2.5 top-2 size-1.5 rounded-full bg-cargo-yellow" />
              </button>
              <div className="relative hidden sm:block">
                <button onClick={() => setProfileOpen((open) => !open)} className="flex items-center gap-2.5 rounded-full border border-white/10 py-1.5 pl-1.5 pr-2.5 transition hover:border-white/25" aria-haspopup="menu" aria-expanded={profileOpen}>
                  <div className="grid size-7 overflow-hidden rounded-full bg-cargo-yellow text-xs font-bold text-ink">
                    {user?.avatar ? <img src={user.avatar} alt="" className="size-full object-cover" /> : `${user?.firstName?.[0] || "C"}${user?.lastName?.[0] || ""}`}
                  </div>
                  <span className="text-xs font-semibold text-white/75">{user?.firstName || "Customer"}</span>
                  <ChevronDown className={`size-3.5 text-white/45 transition ${profileOpen ? "rotate-180" : ""}`} />
                </button>
                {profileOpen && (
                  <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-52 rounded-2xl border border-ink/10 bg-white p-2 shadow-xl" role="menu">
                    <button onClick={() => { setProfileOpen(false); navigate("/settings/account"); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-ink transition hover:bg-ink/5" role="menuitem">
                      <UserRound className="size-4 text-ink/55" /> Profile
                    </button>
                    <button onClick={() => { setProfileOpen(false); navigate("/settings"); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-ink transition hover:bg-ink/5" role="menuitem">
                      <Settings2 className="size-4 text-ink/55" /> Settings
                    </button>
                    <div className="my-1 h-px bg-ink/8" />
                    <button onClick={() => { setProfileOpen(false); handleLogout(); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-ink transition hover:bg-cargo-yellow/15" role="menuitem">
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

      <MobileBottomNavigation />

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
