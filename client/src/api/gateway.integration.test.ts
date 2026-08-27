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

  it("forwards same-origin portal cookies to Laravel API calls under /api/v1", async () => {
    const upstreamResponse = new Response(JSON.stringify({ data: { id: "customer-1" } }), {
      status: 200,
      headers: { "content-type": "application/json", "x-request-id": "upstream-request" },
    });
    const fetchMock = vi.fn().mockResolvedValueOnce(upstreamResponse);
    vi.stubGlobal("fetch", fetchMock);

    const result = response();
    await nodeHandler(request({
      url: "https://portal-staging.example.test/api/gateway?path=v1/session",
      headers: {
        cookie: "newworldcargo_session=session-token; nwc_csrf=csrf-token",
        origin: "https://portal-staging.example.test",
        host: "portal-staging.example.test",
      },
    }), result as never);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual({ data: { id: "customer-1" } });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0].toString()).toBe("https://admin.newworldcargo.com/api/v1/session");
    expect(fetchMock.mock.calls[0][1].headers.get("authorization")).toBeNull();
    expect(fetchMock.mock.calls[0][1].headers.get("cookie")).toBe("newworldcargo_session=session-token; nwc_csrf=csrf-token");
  });
});
