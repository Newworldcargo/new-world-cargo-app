import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";
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
import Legal from "./pages/Legal";
import Invoices from "./pages/Invoices";
import NotFound from "./pages/NotFound";
import { CompleteProfile, ForgotPassword, Login, Register, ResetPassword, SessionExpired, Verify } from "./pages/AuthPages";

function CustomerRouter() {
  return <Switch><Route path="/" component={Home} /><Route path="/shipments" component={Shipments} /><Route path="/shipments/:id" component={ShipmentDetail} /><Route path="/send" component={SendShipment} /><Route path="/quote" component={Quote} /><Route path="/notifications" component={Notifications} /><Route path="/settings/legal/:policy" component={Legal} /><Route path="/settings/legal" component={Legal} /><Route path="/settings/:section" component={SettingsDetail} /><Route path="/settings" component={Settings} /><Route path="/account" component={Settings} /><Route path="/invoices" component={Invoices} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>;
}

function PublicRouter() {
  return <Switch><Route path="/login" component={Login} /><Route path="/register" component={Register} /><Route path="/verify" component={Verify} /><Route path="/forgot-password" component={ForgotPassword} /><Route path="/reset-password" component={ResetPassword} /><Route path="/auth/complete-profile" component={CompleteProfile} /><Route path="/session-expired" component={SessionExpired} /><Route path="/settings/legal/:policy" component={Legal} /><Route path="/settings/legal" component={Legal} /><Route component={NotFound} /></Switch>;
}

function RoutedApp() {
  const [location, navigate] = useLocation(); const { isAuthenticated } = useAuth();
  const isPublic = ["/login", "/register", "/verify", "/forgot-password", "/reset-password", "/auth/complete-profile", "/session-expired"].some(path => location.startsWith(path)) || location.startsWith("/settings/legal");
  useEffect(() => { if (!isAuthenticated && !isPublic) navigate(`/login?returnTo=${encodeURIComponent(location)}`); }, [isAuthenticated, isPublic, location, navigate]);
  if (isPublic) return <PublicRouter />;
  if (!isAuthenticated) return null;
  return <AppShell><CustomerRouter /></AppShell>;
}

export default function App() { return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster theme="light" position="top-center" /><AuthProvider><RoutedApp /></AuthProvider></TooltipProvider></ThemeProvider></ErrorBoundary>; }
