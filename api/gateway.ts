import { randomUUID } from "node:crypto";
import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from "node:http";
import {
  gatewayBodyLimitBytes,
  gatewayCsrfMethods,
  gatewayResponseCacheControl,
  matchGatewayRoute,
  normalizeGatewayPath,
} from "../server/gateway/policy";

type GatewayRequest = IncomingMessage & {
  body?: unknown;
  query?: Record<string, string | string[] | undefined>;
};

type GatewayConfig = {
  backendOrigin: string;
  backendApiPrefix: string;
  serviceToken: string;
  allowedOrigin: string;
  timeoutMs: number;
  sessionExchangePath: string;
  sessionCookieName: string;
};

const safeResponseHeaders = new Set(["content-type", "retry-after"]);
const sessionCookieMaxAgeSeconds = 60 * 60 * 8;

/** Vercel applies this limit before an application JSON body can be read. */
export const config = { api: { bodyParser: { sizeLimit: "1mb" } } };

function responseRequestId(headers: IncomingHttpHeaders) {
  const incoming = headers["x-request-id"];
  const candidate = Array.isArray(incoming) ? incoming[0] : incoming;
  return candidate && /^[A-Za-z0-9._-]{8,128}$/.test(candidate) ? candidate : randomUUID();
}

function readConfig(): GatewayConfig | null {
  const backendOrigin = process.env.NWC_BACKEND_ORIGIN?.replace(/\/+$/, "");
  const serviceToken = process.env.NWC_BFF_SERVICE_TOKEN;
  const allowedOrigin = process.env.NWC_BFF_ALLOWED_ORIGIN?.replace(/\/+$/, "");
  const configuredTimeout = Number(process.env.NWC_BFF_TIMEOUT_MS || 8_000);
  const timeoutMs = Number.isFinite(configuredTimeout) ? Math.min(Math.max(configuredTimeout, 1_000), 12_000) : 8_000;

  if (!backendOrigin || !serviceToken || !allowedOrigin) return null;

  try {
    const backendUrl = new URL(backendOrigin);
    const originUrl = new URL(allowedOrigin);
    if (backendUrl.protocol !== "https:" || originUrl.protocol !== "https:") return null;
  } catch {
    return null;
  }

  const backendApiPrefix = (process.env.NWC_BACKEND_API_PREFIX || "/api").replace(/\/+$/, "");
  if (!backendApiPrefix.startsWith("/") || backendApiPrefix.includes("//") || backendApiPrefix.includes("..")) return null;

  return {
    backendOrigin,
    backendApiPrefix,
    serviceToken,
    allowedOrigin,
    timeoutMs,
    sessionExchangePath: process.env.NWC_BFF_SESSION_EXCHANGE_PATH || "/internal/bff/session-exchange",
    sessionCookieName: process.env.NWC_BFF_SESSION_COOKIE_NAME || "nwc_portal_session",
  };
}

function setBaseHeaders(response: ServerResponse, requestId: string) {
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", gatewayResponseCacheControl);
  response.setHeader("X-Request-ID", requestId);
  response.setHeader("X-Content-Type-Options", "nosniff");
}

function sendProblem(response: ServerResponse, status: number, code: string, message: string, requestId: string) {
  setBaseHeaders(response, requestId);
  response.statusCode = status;
  response.end(JSON.stringify({ error: { code, message, retryable: status >= 500 }, requestId }));
}

function cookieValue(headers: IncomingHttpHeaders, name: string) {
  const rawCookie = headers.cookie;
  if (!rawCookie) return undefined;
  const entry = rawCookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return entry ? entry.slice(name.length + 1) : undefined;
}

function hasApprovedMutationOrigin(headers: IncomingHttpHeaders, allowedOrigin: string) {
  const origin = headers.origin;
  return typeof origin === "string" && origin.replace(/\/+$/, "") === allowedOrigin;
}

function hasCsrfToken(headers: IncomingHttpHeaders) {
  const csrfToken = headers["x-csrf-token"];
  return typeof csrfToken === "string" && csrfToken.length >= 16 && csrfToken.length <= 512;
}

function requestJsonBody(request: GatewayRequest): { body: string | undefined } | { error: "REQUEST_TOO_LARGE" | "UNSUPPORTED_MEDIA_TYPE" } {
  const contentLength = request.headers["content-length"];
  const declaredLength = Number(Array.isArray(contentLength) ? contentLength[0] : contentLength || 0);
  if (Number.isFinite(declaredLength) && declaredLength > gatewayBodyLimitBytes) return { error: "REQUEST_TOO_LARGE" };

  if (request.body === undefined || request.body === null) return { body: undefined };
  const contentType = String(request.headers["content-type"] || "").toLowerCase();
  if (!contentType.startsWith("application/json")) return { error: "UNSUPPORTED_MEDIA_TYPE" };

  const serialized = typeof request.body === "string" ? request.body : JSON.stringify(request.body);
  if (Buffer.byteLength(serialized, "utf8") > gatewayBodyLimitBytes) return { error: "REQUEST_TOO_LARGE" };
  return { body: serialized };
}

function forwardHeaders(request: GatewayRequest, config: GatewayConfig, requestId: string, identityAssertion?: string) {
  const headers = new Headers({
    Accept: "application/json",
    Authorization: `Bearer ${config.serviceToken}`,
    "X-Request-ID": requestId,
    "X-NWC-BFF": "new-world-cargo-portal",
  });
  const optionalHeaders = ["if-match", "idempotency-key", "x-csrf-token"] as const;
  for (const name of optionalHeaders) {
    const value = request.headers[name];
    if (typeof value === "string" && value.length <= 512) headers.set(name, value);
  }
  if (identityAssertion) headers.set("X-NWC-Customer-Assertion", identityAssertion);
  return headers;
}

async function exchangePortalSession(request: GatewayRequest, config: GatewayConfig, requestId: string, signal: AbortSignal) {
  const portalSession = cookieValue(request.headers, config.sessionCookieName);
  if (!portalSession) return null;

  const exchangeUrl = new URL(config.sessionExchangePath, config.backendOrigin);
  const exchangeResponse = await fetch(exchangeUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${config.serviceToken}`,
      "X-Request-ID": requestId,
      "X-NWC-Portal-Session": portalSession,
      "X-NWC-BFF": "new-world-cargo-portal",
    },
    signal,
  });

  if (!exchangeResponse.ok) return null;
  const assertion = exchangeResponse.headers.get("x-nwc-customer-assertion");
  return assertion && assertion.length <= 8_192 ? assertion : null;
}

function sessionSetCookie(config: GatewayConfig, sessionToken: string) {
  return `${config.sessionCookieName}=${encodeURIComponent(sessionToken)}; Path=/; Max-Age=${sessionCookieMaxAgeSeconds}; HttpOnly; Secure; SameSite=Lax`;
}

function csrfSetCookie(csrfToken: string) {
  return `nwc_csrf=${encodeURIComponent(csrfToken)}; Path=/; Max-Age=${sessionCookieMaxAgeSeconds}; Secure; SameSite=Lax`;
}

function clearedSessionCookie(config: GatewayConfig) {
  return `${config.sessionCookieName}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

function logGatewayEvent(requestId: string, routeClass: string, method: string, status: number, startedAt: number) {
  console.info(JSON.stringify({ event: "nwc_bff_request", requestId, routeClass, method, status, durationMs: Date.now() - startedAt }));
}

export default async function handler(request: GatewayRequest, response: ServerResponse) {
  const startedAt = Date.now();
  const requestId = responseRequestId(request.headers);
  const config = readConfig();
  const method = (request.method || "GET").toUpperCase();
  const path = normalizeGatewayPath(request.query?.path);

  if (!config) return sendProblem(response, 503, "GATEWAY_NOT_CONFIGURED", "The secure service connection is not configured.", requestId);
  if (!path) return sendProblem(response, 404, "ROUTE_NOT_FOUND", "That service route is not available.", requestId);

  const route = matchGatewayRoute(method, path);
  if (!route) return sendProblem(response, 404, "ROUTE_NOT_FOUND", "That service route is not available.", requestId);

  if (gatewayCsrfMethods.has(method) && !hasApprovedMutationOrigin(request.headers, config.allowedOrigin)) {
    logGatewayEvent(requestId, route.routeClass, method, 403, startedAt);
    return sendProblem(response, 403, "ORIGIN_NOT_ALLOWED", "This request must come from the customer portal.", requestId);
  }

  if (gatewayCsrfMethods.has(method) && route.access === "session" && !hasCsrfToken(request.headers)) {
    logGatewayEvent(requestId, route.routeClass, method, 403, startedAt);
    return sendProblem(response, 403, "CSRF_TOKEN_REQUIRED", "This request is missing its security token.", requestId);
  }

  const requestBody = requestJsonBody(request);
  if ("error" in requestBody) {
    const bodyError = requestBody.error;
    const isTooLarge = bodyError === "REQUEST_TOO_LARGE";
    logGatewayEvent(requestId, route.routeClass, method, isTooLarge ? 413 : 415, startedAt);
    return sendProblem(response, isTooLarge ? 413 : 415, bodyError, isTooLarge ? "The request is too large." : "Only JSON requests are supported.", requestId);
  }

  const cancellation = new AbortController();
  const timeout = setTimeout(() => cancellation.abort(), config.timeoutMs);
  const abortOnDisconnect = () => cancellation.abort();
  request.once("aborted", abortOnDisconnect);

  try {
    let identityAssertion: string | undefined;
    if (route.access === "session") {
      identityAssertion = (await exchangePortalSession(request, config, requestId, cancellation.signal)) || undefined;
      if (!identityAssertion) {
        logGatewayEvent(requestId, route.routeClass, method, 401, startedAt);
        return sendProblem(response, 401, "UNAUTHENTICATED", "Your session has ended. Please sign in again.", requestId);
      }
    }

    const originalUrl = new URL(request.url || "/api/gateway", config.allowedOrigin);
    const upstreamUrl = new URL(`${config.backendApiPrefix}${path}`, `${config.backendOrigin}/`);
    originalUrl.searchParams.forEach((value, key) => {
      if (key !== "path") upstreamUrl.searchParams.append(key, value);
    });

    const headers = forwardHeaders(request, config, requestId, identityAssertion);
    if (requestBody.body !== undefined) headers.set("Content-Type", "application/json");
    const upstream = await fetch(upstreamUrl, {
      method,
      headers,
      body: requestBody.body,
      signal: cancellation.signal,
    });
    const upstreamBody = Buffer.from(await upstream.arrayBuffer());

    setBaseHeaders(response, upstream.headers.get("x-request-id") || requestId);
    safeResponseHeaders.forEach((header) => {
      const value = upstream.headers.get(header);
      if (value) response.setHeader(header, value);
    });

    const cookies: string[] = [];
    const upstreamPortalSession = upstream.headers.get("x-nwc-bff-session");
    const upstreamCsrf = upstream.headers.get("x-nwc-bff-csrf-token");
    if (upstreamPortalSession) cookies.push(sessionSetCookie(config, upstreamPortalSession));
    if (upstreamCsrf) cookies.push(csrfSetCookie(upstreamCsrf));
    if (path === "/v1/auth/logout") cookies.push(clearedSessionCookie(config));
    if (cookies.length) response.setHeader("Set-Cookie", cookies);

    response.statusCode = upstream.status;
    response.end(upstreamBody);
    logGatewayEvent(requestId, route.routeClass, method, upstream.status, startedAt);
  } catch {
    const status = cancellation.signal.aborted ? 504 : 502;
    logGatewayEvent(requestId, route.routeClass, method, status, startedAt);
    return sendProblem(response, status, cancellation.signal.aborted ? "UPSTREAM_TIMEOUT" : "UPSTREAM_UNAVAILABLE", "The service is temporarily unavailable. Please try again.", requestId);
  } finally {
    clearTimeout(timeout);
    request.removeListener("aborted", abortOnDisconnect);
  }
}
