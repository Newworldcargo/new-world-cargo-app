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

  it("relays the Laravel session and CSRF token needed by the OTP verification request", async () => {
    const registerHeaders = new Headers({
      "content-type": "application/json",
      "x-csrf-token": "csrf-token-from-register",
    });
    registerHeaders.append(
      "set-cookie",
      "newworldcargo_session=session-token; Path=/; Domain=.newworldcargo.com; Secure; HttpOnly; SameSite=Lax",
    );
    registerHeaders.append(
      "set-cookie",
      "nwc_csrf=csrf-token-from-register; Path=/; Domain=.newworldcargo.com; Secure; SameSite=Lax",
    );
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { id: "customer-1", verified: false } }), {
        status: 201,
        headers: registerHeaders,
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: null }), {
        status: 200,
        headers: { "content-type": "application/json", "x-csrf-token": "csrf-token-after-verification" },
      }));
    vi.stubGlobal("fetch", fetchMock);

    const registerResult = response();
    await nodeHandler(request({
      method: "POST",
      url: "https://app.newworldcargo.com/api/gateway?path=v1/auth/register",
      query: { path: "v1/auth/register" },
      headers: {
        origin: "https://app.newworldcargo.com",
        host: "app.newworldcargo.com",
        "content-type": "application/json",
      },
      body: { firstName: "Portal", email: "portal@example.test", phone: "+260000000", password: "password" },
    } as Partial<MockRequest> & { body: object }), registerResult as never);

    expect(registerResult.statusCode).toBe(201);
    expect(registerResult.headers["x-csrf-token"]).toBe("csrf-token-from-register");
    expect(registerResult.headers["set-cookie"]).toEqual(expect.arrayContaining([
      expect.stringContaining("newworldcargo_session=session-token"),
      expect.stringContaining("nwc_csrf=csrf-token-from-register"),
    ]));

    const verifyResult = response();
    await nodeHandler(request({
      method: "POST",
      url: "https://app.newworldcargo.com/api/gateway?path=v1/auth/verify",
      query: { path: "v1/auth/verify" },
      headers: {
        origin: "https://app.newworldcargo.com",
        host: "app.newworldcargo.com",
        cookie: "newworldcargo_session=session-token; nwc_csrf=csrf-token-from-register",
        "content-type": "application/json",
        "x-csrf-token": "csrf-token-from-register",
      },
      body: { code: "123456" },
    } as Partial<MockRequest> & { body: object }), verifyResult as never);

    expect(verifyResult.statusCode).toBe(200);
    expect(fetchMock.mock.calls[1][0].toString()).toBe("https://admin.newworldcargo.com/api/v1/auth/verify");
    expect(fetchMock.mock.calls[1][1].headers.get("cookie")).toContain("newworldcargo_session=session-token");
    expect(fetchMock.mock.calls[1][1].headers.get("x-csrf-token")).toBe("csrf-token-from-register");
  });

  it("forwards an empty draft submission POST without requiring a content type", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ data: { id: "booking-1", status: "pending" } }), {
        status: 201,
        headers: { "content-type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = response();
    await nodeHandler(
      request({
        method: "POST",
        url: "https://app.newworldcargo.com/api/gateway?path=v1/shipment-drafts/42/submit",
        query: { path: "v1/shipment-drafts/42/submit" },
        headers: {
          origin: "https://app.newworldcargo.com",
          host: "app.newworldcargo.com",
          cookie: "newworldcargo_session=session-token; nwc_csrf=csrf-token-123456",
          "x-csrf-token": "csrf-token-123456",
        },
        body: "",
      } as Partial<MockRequest> & { body: string }),
      result as never
    );

    expect(result.statusCode).toBe(201);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0].toString()).toBe(
      "https://admin.newworldcargo.com/api/v1/shipment-drafts/42/submit"
    );
    expect(fetchMock.mock.calls[0][1].body).toBeUndefined();
  });
});
