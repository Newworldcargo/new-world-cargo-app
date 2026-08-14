// New World Cargo style reminder: Poppins, dark command-center canvas, Cargo Yellow action color, lavender route accents, mobile-first.

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AppShell } from "./components/app-shell";
import Home from "./pages/Home";
import Shipments from "./pages/Shipments";
import ShipmentDetail from "./pages/ShipmentDetail";
import SendShipment from "./pages/SendShipment";
import Quote from "./pages/Quote";
import Notifications from "./pages/Notifications";
import Account from "./pages/Account";
import NotFound from "./pages/NotFound";

function Router() { return <Switch><Route path="/" component={Home} /><Route path="/shipments" component={Shipments} /><Route path="/shipments/:id" component={ShipmentDetail} /><Route path="/send" component={SendShipment} /><Route path="/quote" component={Quote} /><Route path="/notifications" component={Notifications} /><Route path="/account" component={Account} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>; }

export default function App() { return <ErrorBoundary><ThemeProvider defaultTheme="dark"><TooltipProvider><Toaster theme="dark" position="top-center" /><AppShell><Router /></AppShell></TooltipProvider></ThemeProvider></ErrorBoundary>; }

