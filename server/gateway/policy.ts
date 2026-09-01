export type GatewayAccess = "public" | "bootstrap" | "session";

export type GatewayRoute = {
  pattern: RegExp;
  methods: readonly string[];
  access: GatewayAccess;
  routeClass: string;
};

const ID_SEGMENT = "[^/?#]+";

/**
 * The browser gateway deliberately mirrors only paths used by the typed HTTP
 * adapters. Add an entry here before adding a new browser-facing API method.
 */
export const gatewayAllowedRoutes: readonly GatewayRoute[] = [
  { pattern: /^\/v1\/session$/, methods: ["GET"], access: "session", routeClass: "session" },
  { pattern: /^\/v1\/auth\/(login|register)$/, methods: ["POST"], access: "bootstrap", routeClass: "authentication" },
  { pattern: /^\/v1\/auth\/password\/(forgot|reset)$/, methods: ["POST"], access: "bootstrap", routeClass: "authentication" },
  { pattern: /^\/v1\/auth\/(verify|verify\/resend|password\/verify|password\/change|logout)$/, methods: ["POST"], access: "session", routeClass: "authentication" },
  { pattern: /^\/v1\/profile$/, methods: ["PATCH", "DELETE"], access: "session", routeClass: "profile" },
  { pattern: /^\/v1\/shipments$/, methods: ["GET"], access: "session", routeClass: "shipments" },
  { pattern: new RegExp(`^/v1/shipments/${ID_SEGMENT}$`), methods: ["GET"], access: "session", routeClass: "shipments" },
  { pattern: new RegExp(`^/v1/shipments/${ID_SEGMENT}/actions$`), methods: ["POST"], access: "session", routeClass: "shipment-action" },
  { pattern: new RegExp(`^/v1/public/tracking/${ID_SEGMENT}$`), methods: ["GET"], access: "public", routeClass: "public-tracking" },
  { pattern: /^\/v1\/invoices$/, methods: ["GET"], access: "session", routeClass: "invoices" },
  { pattern: new RegExp(`^/v1/invoices/${ID_SEGMENT}$`), methods: ["GET"], access: "session", routeClass: "invoices" },
  { pattern: /^\/v1\/wallet$/, methods: ["GET"], access: "session", routeClass: "wallet" },
  { pattern: /^\/v1\/addresses$/, methods: ["GET", "POST"], access: "session", routeClass: "addresses" },
  { pattern: new RegExp(`^/v1/addresses/${ID_SEGMENT}$`), methods: ["PUT", "DELETE"], access: "session", routeClass: "addresses" },
  { pattern: new RegExp(`^/v1/addresses/${ID_SEGMENT}/default$`), methods: ["PATCH"], access: "session", routeClass: "addresses" },
  { pattern: /^\/v1\/recipients$/, methods: ["GET", "POST"], access: "session", routeClass: "recipients" },
  { pattern: new RegExp(`^/v1/recipients/${ID_SEGMENT}$`), methods: ["PUT", "DELETE"], access: "session", routeClass: "recipients" },
  { pattern: /^\/v1\/reference-data$/, methods: ["GET"], access: "session", routeClass: "reference-data" },
  { pattern: /^\/v1\/payments\/intents$/, methods: ["POST"], access: "session", routeClass: "payments" },
  { pattern: /^\/v1\/files\/upload-intents$/, methods: ["POST"], access: "session", routeClass: "files" },
  { pattern: new RegExp(`^/v1/files/${ID_SEGMENT}/complete$`), methods: ["POST"], access: "session", routeClass: "files" },
  { pattern: /^\/v1\/notifications$/, methods: ["GET"], access: "session", routeClass: "notifications" },
  { pattern: new RegExp(`^/v1/notifications/${ID_SEGMENT}/read$`), methods: ["PATCH"], access: "session", routeClass: "notifications" },
  { pattern: /^\/v1\/notifications\/read-all$/, methods: ["POST"], access: "session", routeClass: "notifications" },
  { pattern: /^\/v1\/support\/cases$/, methods: ["GET", "POST"], access: "session", routeClass: "support" },
  { pattern: /^\/v1\/returns$/, methods: ["GET", "POST"], access: "session", routeClass: "returns" },
  { pattern: /^\/v1\/pickups\/current$/, methods: ["GET"], access: "session", routeClass: "pickups" },
  { pattern: /^\/v1\/pickups$/, methods: ["POST"], access: "session", routeClass: "pickups" },
  { pattern: new RegExp(`^/v1/pickups/${ID_SEGMENT}/cancel$`), methods: ["POST"], access: "session", routeClass: "pickups" },
  { pattern: /^\/v1\/security\/sessions$/, methods: ["GET"], access: "session", routeClass: "security-sessions" },
  { pattern: new RegExp(`^/v1/security/sessions/${ID_SEGMENT}/trust$`), methods: ["PATCH"], access: "session", routeClass: "security-sessions" },
  { pattern: new RegExp(`^/v1/security/sessions/${ID_SEGMENT}$`), methods: ["DELETE"], access: "session", routeClass: "security-sessions" },
];

export const gatewayBodyLimitBytes = 1_000_000;
export const gatewayResponseCacheControl = "private, no-store, max-age=0";
export const gatewayCsrfMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function normalizeGatewayPath(capturedPath: string | string[] | undefined) {
  const rawPath = Array.isArray(capturedPath) ? capturedPath.join("/") : capturedPath;
  if (!rawPath || rawPath.includes("?") || rawPath.includes("#") || rawPath.includes("\\")) return null;

  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(rawPath);
  } catch {
    return null;
  }

  const segments = decodedPath.split("/");
  if (!decodedPath.startsWith("v1/") || segments.some((segment) => segment === "." || segment === "..")) return null;
  return `/${decodedPath}`;
}

export function matchGatewayRoute(method: string, path: string) {
  const normalizedMethod = method.toUpperCase();
  return gatewayAllowedRoutes.find((route) => route.pattern.test(path) && route.methods.includes(normalizedMethod));
}
