import { httpCustomerPortalPort } from "./adapters/http";
import { mockCustomerPortalPort } from "./adapters/mock";

export type PortalDataMode = "mock" | "http";

// Production is server-backed by default. Mock mode is opt-in for isolated UI demos only.
export const portalDataMode: PortalDataMode = import.meta.env.VITE_NWC_DATA_MODE === "mock" ? "mock" : "http";

// This is the only adapter-selection point. Set VITE_NWC_DATA_MODE=mock only for
// an isolated local demo; production and staging use the same-origin BFF by default.
export const customerPortalRepository = portalDataMode === "http" ? httpCustomerPortalPort : mockCustomerPortalPort;
