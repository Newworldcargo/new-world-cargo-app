export const PRIMARY_MOBILE_TAB_ROUTES = ["/", "/shipments", "/send", "/invoices", "/settings"] as const;

export function isPrimaryMobileTabRoute(location: string) {
  const pathname = location.split("?")[0].replace(/\/+$/, "") || "/";
  return PRIMARY_MOBILE_TAB_ROUTES.includes(pathname as (typeof PRIMARY_MOBILE_TAB_ROUTES)[number]);
}
