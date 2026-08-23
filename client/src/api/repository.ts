import { httpCustomerPortalPort } from "./adapters/http";
import { mockCustomerPortalPort } from "./adapters/mock";

export type PortalDataMode = "mock" | "http";

export const portalDataMode: PortalDataMode = import.meta.env.VITE_NWC_DATA_MODE === "http" ? "http" : "mock";

// This is the only adapter-selection point. Set VITE_NWC_DATA_MODE=http and
// VITE_NWC_API_BASE_URL to switch the entire portal to the live API contract.
export const customerPortalRepository = portalDataMode === "http" ? httpCustomerPortalPort : mockCustomerPortalPort;

