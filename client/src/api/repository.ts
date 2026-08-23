import { httpCustomerPortalPort } from "./adapters/http";

export type PortalDataMode = "http";

export const portalDataMode: PortalDataMode = "http";

export const customerPortalRepository = httpCustomerPortalPort;
