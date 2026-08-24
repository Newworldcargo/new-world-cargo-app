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
  timeoutMs: number;
};

const backendOrigin = "https://api.newworldcargo.com";
const backendApiPrefix = "/api";
const timeoutMs = 8_000;
const safeResponseHeaders = new Set(["content-type", "retry-after"]);
const safeRequestHeaders = ["cookie", "if-match", "idempotency-key", "x-csrf-token"] as const;
const forwardedCookieNames = ["newworldcargo_session", "nwc_csrf", "XSRF-TOKEN"];

/** Vercel applies this limit before an application JSON body can be read. */
export const config = { api: { bodyParser: { sizeLimit: "1mb" } } };

function responseRequestId(headers: IncomingHttpHeaders) {
  const incoming = headers["x-request-id"];
  const candidate = Array.isArray(incoming) ? incoming[0] : incoming;
  return candidate && /^[A-Za-z0-9._-]{8,128}$/.test(candidate) ? candidate : randomUUID();
}

function readConfig(): GatewayConfig {
  return {
    backendOrigin,
    backendApiPrefix,
    timeoutMs,
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

function requestOrigin(headers: IncomingHttpHeaders) {
  const host = headers["x-forwarded-host"] || headers.host;
  const candidate = Array.isArray(host) ? host[0] : host;
  return candidate ? `https://${candidate}` : null;
}

function hasApprovedMutationOrigin(headers: IncomingHttpHeaders) {
  const origin = headers.origin;
  const expected = requestOrigin(headers);
  return typeof origin === "string" && expected !== null && origin.replace(/\/+$/, "") === expected;
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

function forwardHeaders(request: GatewayRequest, requestId: string) {
  const headers = new Headers({
    Accept: "application/json",
    "X-Request-ID": requestId,
    "X-NWC-Portal-Gateway": "new-world-cargo-app",
  });
  for (const name of safeRequestHeaders) {
    const value = request.headers[name];
    const maxLength = name === "cookie" ? 8_192 : 512;
    if (typeof value === "string" && value.length <= maxLength) headers.set(name, value);
  }
  return headers;
}

function upstreamSetCookies(headers: Headers) {
  const maybeWithSetCookie = headers as Headers & { getSetCookie?: () => string[] };
  const cookies = maybeWithSetCookie.getSetCookie?.() || [];
  const fallback = headers.get("set-cookie");
  if (!cookies.length && fallback) cookies.push(fallback);
  return cookies.filter((cookie) => forwardedCookieNames.some((name) => cookie.startsWith(`${name}=`)));
}

function logGatewayEvent(requestId: string, routeClass: string, method: string, status: number, startedAt: number) {
  console.info(JSON.stringify({ event: "nwc_bff_request", requestId, routeClass, method, status, durationMs: Date.now() - startedAt }));
}

export async function nodeHandler(request: GatewayRequest, response: ServerResponse) {
  const startedAt = Date.now();
  const requestId = responseRequestId(request.headers);
  const config = readConfig();
  const method = (request.method || "GET").toUpperCase();
  const path = normalizeGatewayPath(request.query?.path);

  if (!path) return sendProblem(response, 404, "ROUTE_NOT_FOUND", "That service route is not available.", requestId);

  const route = matchGatewayRoute(method, path);
  if (!route) return sendProblem(response, 404, "ROUTE_NOT_FOUND", "That service route is not available.", requestId);

  if (gatewayCsrfMethods.has(method) && !hasApprovedMutationOrigin(request.headers)) {
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
    const originalUrl = new URL(request.url || "/api/gateway", requestOrigin(request.headers) || "https://new-world-cargo-app.vercel.app");
    const upstreamUrl = new URL(`${config.backendApiPrefix}${path}`, `${config.backendOrigin}/`);
    originalUrl.searchParams.forEach((value, key) => {
      if (key !== "path") upstreamUrl.searchParams.append(key, value);
    });

    const headers = forwardHeaders(request, requestId);
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

    const cookies = upstreamSetCookies(upstream.headers);
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

class WebResponseAdapter {
  statusCode = 200;
  private headers = new Headers();

  constructor(private readonly resolve: (response: Response) => void) {}

  setHeader(name: string, value: string | string[]) {
    this.headers.delete(name);
    if (Array.isArray(value)) {
      value.forEach((item) => this.headers.append(name, item));
      return;
    }
    this.headers.set(name, value);
  }

  end(body?: string | Buffer) {
    const responseBody = body instanceof Buffer ? new Uint8Array(body) : body;
    this.resolve(new Response(responseBody === undefined ? null : responseBody, { status: this.statusCode, headers: this.headers }));
  }
}

export default {
  async fetch(request: Request) {
    const url = new URL(request.url);
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => { headers[key] = value; });
    if (!headers.host) headers.host = url.host;
    const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.text();
    const gatewayRequest = {
      method: request.method,
      url: request.url,
      headers,
      query: Object.fromEntries(url.searchParams.entries()),
      body,
      once() { return this; },
      removeListener() { return this; },
    } as unknown as GatewayRequest;

    return new Promise<Response>((resolve) => {
      const gatewayResponse = new WebResponseAdapter(resolve);
      void nodeHandler(gatewayRequest, gatewayResponse as unknown as ServerResponse);
    });
  },
};
