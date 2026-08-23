import { httpCustomerPortalPort } from "./adapters/http";
import { mockCustomerPortalPort } from "./adapters/mock";

export type PortalDataMode = "mock" | "http";

export const portalDataMode: PortalDataMode = import.meta.env.VITE_NWC_DATA_MODE === "http" ? "http" : "mock";

// This is the only adapter-selection point. Set VITE_NWC_DATA_MODE=http after
// the same-origin Vercel gateway and its server-only backend configuration are ready.
export const customerPortalRepository = portalDataMode === "http" ? httpCustomerPortalPort : mockCustomerPortalPort;
