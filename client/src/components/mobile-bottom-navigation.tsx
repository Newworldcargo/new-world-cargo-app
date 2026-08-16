import { House, Package, Plus, ReceiptText, Settings2, type LucideIcon } from "lucide-react";
import { useLocation } from "wouter";
import { mobileNavigationItemClass } from "@/lib/navigation-style";
import { isPrimaryMobileTabRoute } from "@/lib/primary-mobile-navigation";

type PrimaryTab = { label: string; href: string; icon: LucideIcon };

const primaryTabs: PrimaryTab[] = [
  { label: "Home", href: "/", icon: House },
  { label: "Shipments", href: "/shipments", icon: Package },
  { label: "Send", href: "/send", icon: Plus },
  { label: "Invoices", href: "/invoices", icon: ReceiptText },
  { label: "Settings", href: "/settings", icon: Settings2 },
];

export function MobileBottomNavigation() {
  const [location, navigate] = useLocation();
  const pathname = location.split("?")[0];

  if (!isPrimaryMobileTabRoute(location)) return null;

  return (
    <nav className="mobile-bottom-navigation fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-[26px] border border-white/10 bg-brand-secondary p-2 shadow-2xl backdrop-blur-xl lg:hidden" aria-label="Primary navigation">
      {primaryTabs.map((tab) => {
        const Icon = tab.icon;
        const active = pathname === tab.href;
        return (
          <button key={tab.href} onClick={() => navigate(tab.href)} className={`${mobileNavigationItemClass(active)} mobile-bottom-navigation__tab ${active ? "mobile-bottom-navigation__tab--active" : "mobile-bottom-navigation__tab--inactive"}`} aria-current={active ? "page" : undefined}>
            <Icon className="size-5" strokeWidth={active ? 2.4 : 1.8} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
