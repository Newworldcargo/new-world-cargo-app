import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import { lazy, Suspense, useEffect, useState } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AppShell } from "./components/app-shell";
import { AppPreloader, EmptyState, ErrorState, OfflineBanner } from "./components/async-state";
import { getCustomerPageState } from "./lib/page-state";

const Home = lazy(() => import("./pages/Home"));
const Shipments = lazy(() => import("./pages/Shipments"));
const ShipmentDetail = lazy(() => import("./pages/ShipmentDetail"));
const SendShipment = lazy(() => import("./pages/SendShipment"));
const Quote = lazy(() => import("./pages/Quote"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Settings = lazy(() => import("./pages/Settings"));
const SettingsDetail = lazy(() => import("./pages/SettingsDetail"));
const SignInActivity = lazy(() => import("./pages/SignInActivity"));
const Recipients = lazy(() => import("./pages/Recipients"));
const Drafts = lazy(() => import("./pages/Drafts"));
const Tracking = lazy(() => import("./pages/Tracking"));
const Support = lazy(() => import("./pages/Support"));
const Returns = lazy(() => import("./pages/Returns"));
const Pickup = lazy(() => import("./pages/Pickup"));
const ProofOfDelivery = lazy(() => import("./pages/ProofOfDelivery"));
const Legal = lazy(() => import("./pages/Legal"));
const Invoices = lazy(() => import("./pages/Invoices"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Login = lazy(() => import("./pages/AuthPages").then((module) => ({ default: module.Login })));
const Register = lazy(() => import("./pages/AuthPages").then((module) => ({ default: module.Register })));
const Verify = lazy(() => import("./pages/AuthPages").then((module) => ({ default: module.Verify })));
const ForgotPassword = lazy(() => import("./pages/AuthPages").then((module) => ({ default: module.ForgotPassword })));
const ResetPassword = lazy(() => import("./pages/AuthPages").then((module) => ({ default: module.ResetPassword })));
const CompleteProfile = lazy(() => import("./pages/AuthPages").then((module) => ({ default: module.CompleteProfile })));
const SessionExpired = lazy(() => import("./pages/AuthPages").then((module) => ({ default: module.SessionExpired })));

function CustomerRouter() {
  const [location, navigate] = useLocation();
  const pageState = getCustomerPageState(typeof window === "undefined" ? "" : window.location.search);
  const retry = () => window.location.assign(location.split("?")[0] || "/");
  if (pageState === "loading") return <AppPreloader label="Loading your customer workspace…" />;
  if (pageState === "empty") return <EmptyState title="Nothing to show here yet" detail="When there is new cargo activity, it will appear here." action={{ label: "View shipments", onClick: () => navigate("/shipments") }} />;
  if (pageState === "error") return <ErrorState title="We could not load this page" detail="Your saved details are safe. Please try again." action={{ label: "Try again", onClick: retry }} />;
  return <Switch><Route path="/" component={Home} /><Route path="/track" component={Tracking} /><Route path="/support" component={Support} /><Route path="/returns" component={Returns} /><Route path="/pickups" component={Pickup} /><Route path="/shipments/drafts" component={Drafts} /><Route path="/shipments" component={Shipments} /><Route path="/shipments/:id/proof" component={ProofOfDelivery} /><Route path="/shipments/:id" component={ShipmentDetail} /><Route path="/send" component={SendShipment} /><Route path="/quote" component={Quote} /><Route path="/notifications" component={Notifications} /><Route path="/settings/legal/:policy" component={Legal} /><Route path="/settings/legal" component={Legal} /><Route path="/settings/security/activity" component={SignInActivity} /><Route path="/settings/recipients" component={Recipients} /><Route path="/settings/:section" component={SettingsDetail} /><Route path="/settings" component={Settings} /><Route path="/account" component={Settings} /><Route path="/invoices" component={Invoices} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>;
}

function PublicTrackingRoute() {
  const [location] = useLocation();
  const pageState = getCustomerPageState(typeof window === "undefined" ? "" : window.location.search);
  const retry = () => window.location.assign(location.split("?")[0] || "/shipments/tracking");
  if (pageState === "loading") return <AppPreloader label="Loading tracking details…" />;
  if (pageState === "empty") return <EmptyState title="No tracking activity yet" detail="Enter your tracking number to find the latest shipment update." action={{ label: "Start tracking", onClick: retry }} />;
  if (pageState === "error") return <ErrorState title="We could not load tracking" detail="Please check your connection and try again." action={{ label: "Try again", onClick: retry }} />;
  return <Tracking />;
}

function PublicRouter() {
  return <Switch><Route path="/login" component={Login} /><Route path="/register" component={Register} /><Route path="/verify" component={Verify} /><Route path="/forgot-password" component={ForgotPassword} /><Route path="/reset-password" component={ResetPassword} /><Route path="/reset-password/:token" component={ResetPassword} /><Route path="/password/reset/:token" component={ResetPassword} /><Route path="/auth/complete-profile" component={CompleteProfile} /><Route path="/session-expired" component={SessionExpired} /><Route path="/shipments/tracking" component={PublicTrackingRoute} /><Route path="/shipments/tracking/:code" component={PublicTrackingRoute} /><Route path="/:locale/shipments/tracking" component={PublicTrackingRoute} /><Route path="/:locale/shipments/tracking/:code" component={PublicTrackingRoute} /><Route path="/track" component={PublicTrackingRoute} /><Route path="/settings/legal/:policy" component={Legal} /><Route path="/settings/legal" component={Legal} /><Route component={NotFound} /></Switch>;
}

function RoutedApp() {
  const [location, navigate] = useLocation();
  const { isAuthenticated, loading: sessionLoading, sessionError, retrySession } = useAuth();
  const [booting, setBooting] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => setBooting(false), 180);
    return () => window.clearTimeout(timer);
  }, []);
  const isLegacyPublicTracking = /^\/[a-z]{2}\/shipments\/tracking(\/|$)/i.test(location);
  const isPublic = ["/login", "/register", "/verify", "/forgot-password", "/reset-password", "/password/reset", "/auth/complete-profile", "/session-expired", "/shipments/tracking", "/track"].some(path => location.startsWith(path)) || isLegacyPublicTracking || location.startsWith("/settings/legal");
  useEffect(() => { if (!isAuthenticated && !isPublic) navigate(`/login?returnTo=${encodeURIComponent(location)}`); }, [isAuthenticated, isPublic, location, navigate]);
  if (booting || sessionLoading) return <AppPreloader />;
  if (isPublic) return <PublicRouter />;
  if (sessionError) return <ErrorState title="We could not restore your session" detail="Your account has not been signed out. Check your connection and try again." action={{ label: "Try again", onClick: retrySession }} />;
  if (!isAuthenticated) return null;
  return <AppShell><CustomerRouter /></AppShell>;
}

export default function App() { return <ThemeProvider defaultTheme="light"><TooltipProvider><Toaster theme="light" position="top-center" closeButton richColors /><ErrorBoundary><AuthProvider><OfflineBanner /><Suspense fallback={<AppPreloader label="Loading New World Cargo…" />}><RoutedApp /></Suspense></AuthProvider></ErrorBoundary></TooltipProvider></ThemeProvider>; }
