import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import { useEffect, useState } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AppShell } from "./components/app-shell";
import Home from "./pages/Home";
import Shipments from "./pages/Shipments";
import ShipmentDetail from "./pages/ShipmentDetail";
import SendShipment from "./pages/SendShipment";
import Quote from "./pages/Quote";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import SettingsDetail from "./pages/SettingsDetail";
import SignInActivity from "./pages/SignInActivity";
import Recipients from "./pages/Recipients";
import Drafts from "./pages/Drafts";
import Tracking from "./pages/Tracking";
import Support from "./pages/Support";
import Returns from "./pages/Returns";
import Pickup from "./pages/Pickup";
import ProofOfDelivery from "./pages/ProofOfDelivery";
import ProfilePhoto from "./pages/ProfilePhoto";
import Legal from "./pages/Legal";
import Invoices from "./pages/Invoices";
import NotFound from "./pages/NotFound";
import { CompleteProfile, ForgotPassword, Login, Register, ResetPassword, SessionExpired, Verify } from "./pages/AuthPages";
import { AppPreloader, EmptyState, ErrorState, OfflineBanner } from "./components/async-state";
import { getCustomerPageState } from "./lib/page-state";

function CustomerRouter() {
  const [location, navigate] = useLocation();
  const pageState = getCustomerPageState(typeof window === "undefined" ? "" : window.location.search);
  const retry = () => window.location.assign(location.split("?")[0] || "/");
  if (pageState === "loading") return <AppPreloader label="Loading your customer workspace…" />;
  if (pageState === "empty") return <EmptyState title="Nothing to show here yet" detail="When there is new cargo activity, it will appear here." action={{ label: "View shipments", onClick: () => navigate("/shipments") }} />;
  if (pageState === "error") return <ErrorState title="We could not load this page" detail="Your saved details are safe. Please try again." action={{ label: "Try again", onClick: retry }} />;
  return <Switch><Route path="/" component={Home} /><Route path="/track" component={Tracking} /><Route path="/support" component={Support} /><Route path="/returns" component={Returns} /><Route path="/pickups" component={Pickup} /><Route path="/shipments/drafts" component={Drafts} /><Route path="/shipments" component={Shipments} /><Route path="/shipments/:id/proof" component={ProofOfDelivery} /><Route path="/shipments/:id" component={ShipmentDetail} /><Route path="/send" component={SendShipment} /><Route path="/quote" component={Quote} /><Route path="/notifications" component={Notifications} /><Route path="/settings/legal/:policy" component={Legal} /><Route path="/settings/legal" component={Legal} /><Route path="/settings/security/activity" component={SignInActivity} /><Route path="/settings/profile-photo" component={ProfilePhoto} /><Route path="/settings/recipients" component={Recipients} /><Route path="/settings/:section" component={SettingsDetail} /><Route path="/settings" component={Settings} /><Route path="/account" component={Settings} /><Route path="/invoices" component={Invoices} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>;
}

function PublicTrackingRoute() {
  const [location] = useLocation();
  const pageState = getCustomerPageState(typeof window === "undefined" ? "" : window.location.search);
  const retry = () => window.location.assign(location.split("?")[0] || "/track");
  if (pageState === "loading") return <AppPreloader label="Loading tracking details…" />;
  if (pageState === "empty") return <EmptyState title="No tracking activity yet" detail="Enter your tracking number to find the latest shipment update." action={{ label: "Start tracking", onClick: retry }} />;
  if (pageState === "error") return <ErrorState title="We could not load tracking" detail="Please check your connection and try again." action={{ label: "Try again", onClick: retry }} />;
  return <Tracking />;
}

function PublicRouter() {
  return <Switch><Route path="/login" component={Login} /><Route path="/register" component={Register} /><Route path="/verify" component={Verify} /><Route path="/forgot-password" component={ForgotPassword} /><Route path="/reset-password" component={ResetPassword} /><Route path="/auth/complete-profile" component={CompleteProfile} /><Route path="/session-expired" component={SessionExpired} /><Route path="/track" component={PublicTrackingRoute} /><Route path="/settings/legal/:policy" component={Legal} /><Route path="/settings/legal" component={Legal} /><Route component={NotFound} /></Switch>;
}

function RoutedApp() {
  const [location, navigate] = useLocation();
  const { isAuthenticated, loading: sessionLoading } = useAuth();
  const [booting, setBooting] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => setBooting(false), 180);
    return () => window.clearTimeout(timer);
  }, []);
  const isPublic = ["/login", "/register", "/verify", "/forgot-password", "/reset-password", "/auth/complete-profile", "/session-expired", "/track"].some(path => location.startsWith(path)) || location.startsWith("/settings/legal");
  useEffect(() => { if (!isAuthenticated && !isPublic) navigate(`/login?returnTo=${encodeURIComponent(location)}`); }, [isAuthenticated, isPublic, location, navigate]);
  if (booting || sessionLoading) return <AppPreloader />;
  if (isPublic) return <PublicRouter />;
  if (!isAuthenticated) return null;
  return <AppShell><CustomerRouter /></AppShell>;
}

export default function App() { return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster theme="light" position="top-center" /><AuthProvider><OfflineBanner /><RoutedApp /></AuthProvider></TooltipProvider></ThemeProvider></ErrorBoundary>; }
