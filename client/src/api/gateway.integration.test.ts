import { EventEmitter } from "node:events";
import { afterEach, describe, expect, it, vi } from "vitest";
import { nodeHandler } from "../../../api/gateway";

type MockRequest = EventEmitter & {
  method: string;
  url: string;
  headers: Record<string, string>;
  query: Record<string, string>;
};

type MockResponse = {
  statusCode: number;
  headers: Record<string, string | string[]>;
  body: string;
  setHeader(name: string, value: string | string[]): void;
  end(body?: string | Buffer): void;
};

function request(overrides: Partial<MockRequest> = {}) {
  const value = new EventEmitter() as MockRequest;
  value.method = "GET";
  value.url = "/api/gateway/v1/session";
  value.headers = {
    cookie: "nwc_portal_session=portal-session-token",
    origin: "https://portal-staging.example.test",
  };
  value.query = { path: "v1/session" };
  Object.assign(value, overrides);
  return value;
}

function response() {
  const value: MockResponse = {
    statusCode: 0,
    headers: {},
    body: "",
    setHeader(name, headerValue) {
      this.headers[name.toLowerCase()] = headerValue;
    },
    end(body) {
      this.body = body?.toString() ?? "";
    },
  };
  return value;
}

describe("server-side BFF to Laravel integration", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("exchanges the HttpOnly portal session and forwards Laravel API calls under /api/v1", async () => {
    vi.stubEnv("NWC_BACKEND_ORIGIN", "https://laravel-staging.example.test");
    vi.stubEnv("NWC_BACKEND_API_PREFIX", "/api");
    vi.stubEnv("NWC_BFF_SERVICE_TOKEN", "test-service-token");
    vi.stubEnv("NWC_BFF_ALLOWED_ORIGIN", "https://portal-staging.example.test");

    const exchangeResponse = new Response(JSON.stringify({ data: null }), {
      status: 200,
      headers: { "x-nwc-customer-assertion": "signed-customer-assertion" },
    });
    const upstreamResponse = new Response(JSON.stringify({ data: { id: "customer-1" } }), {
      status: 200,
      headers: { "content-type": "application/json", "x-request-id": "upstream-request" },
    });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(exchangeResponse)
      .mockResolvedValueOnce(upstreamResponse);
    vi.stubGlobal("fetch", fetchMock);

    const result = response();
    await nodeHandler(request(), result as never);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual({ data: { id: "customer-1" } });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0].toString()).toBe("https://laravel-staging.example.test/internal/bff/session-exchange");
    expect(fetchMock.mock.calls[1][0].toString()).toBe("https://laravel-staging.example.test/api/v1/session");
    expect(fetchMock.mock.calls[1][1].headers.get("authorization")).toBe("Bearer test-service-token");
    expect(fetchMock.mock.calls[1][1].headers.get("x-nwc-customer-assertion")).toBe("signed-customer-assertion");
  });
});
