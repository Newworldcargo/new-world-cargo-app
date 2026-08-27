import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  gatewayAllowedRoutes,
  gatewayResponseCacheControl,
  matchGatewayRoute,
  normalizeGatewayPath,
} from "../../../server/gateway/policy";

const projectRoot = new URL("../../../", import.meta.url);

describe("server-side BFF gateway architecture", () => {
  it("allows only adapter-backed endpoint and method pairs", () => {
    expect(matchGatewayRoute("GET", "/v1/shipments")).toMatchObject({ routeClass: "shipments", access: "session" });
    expect(matchGatewayRoute("POST", "/v1/shipments/SH-102/actions")).toMatchObject({ routeClass: "shipment-action" });
    expect(matchGatewayRoute("GET", "/v1/public/tracking/NWC-102")).toMatchObject({ access: "public" });
    expect(matchGatewayRoute("POST", "/v1/shipments")).toBeUndefined();
    expect(matchGatewayRoute("GET", "/v1/admin/customers")).toBeUndefined();
    expect(gatewayAllowedRoutes.length).toBeGreaterThan(20);
  });

  it("rejects malformed or traversal-like captured gateway paths", () => {
    expect(normalizeGatewayPath("v1/shipments")).toBe("/v1/shipments");
    expect(normalizeGatewayPath("v1/shipments/%2E%2E/admin")).toBeNull();
    expect(normalizeGatewayPath("v1/shipments?redirect=https://example.com")).toBeNull();
    expect(normalizeGatewayPath("v2/shipments")).toBeNull();
  });

  it("keeps private gateway responses out of browser and CDN caches", () => {
    expect(gatewayResponseCacheControl).toContain("no-store");
  });

  it("does not expose a configurable backend origin to client source", () => {
    const clientTransport = readFileSync(new URL("http.ts", import.meta.url), "utf8");
    const clientRepository = readFileSync(new URL("repository.ts", import.meta.url), "utf8");
    expect(clientTransport).toContain('"/api/gateway/v1"');
    expect(`${clientTransport}\n${clientRepository}`).not.toContain("VITE_NWC_API_BASE_URL");
  });

  it("uses fixed backend routing, header filtering, and a route allow-list instead of frontend env or an open proxy", () => {
    const gatewaySource = readFileSync(new URL("../../../api/gateway.ts", import.meta.url), "utf8");
    expect(gatewaySource).toContain('"https://admin.newworldcargo.com"');
    expect(gatewaySource).toContain("matchGatewayRoute");
    expect(gatewaySource).toContain("safeResponseHeaders");
    expect(gatewaySource).not.toContain("process.env");
    expect(gatewaySource).not.toContain("NWC_BFF");
    expect(gatewaySource).not.toContain("VITE_NWC_");
  });

  it("routes the Function before the SPA fallback and sets a no-store API policy", () => {
    const vercel = JSON.parse(readFileSync(new URL("../../../vercel.json", import.meta.url), "utf8")) as {
      functions: Record<string, unknown>;
      rewrites: Array<{ source: string; destination: string }>;
      headers: Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
    };
    const gatewayRewriteIndex = vercel.rewrites.findIndex((rewrite) => rewrite.source === "/api/gateway/:path*");
    const spaFallbackIndex = vercel.rewrites.findIndex((rewrite) => rewrite.source === "/(.*)");
    const gatewayHeaders = vercel.headers.find((entry) => entry.source === "/api/gateway/(.*)");

    expect(vercel.functions["api/gateway.ts"]).toBeTruthy();
    expect(gatewayRewriteIndex).toBeGreaterThanOrEqual(0);
    expect(gatewayRewriteIndex).toBeLessThan(spaFallbackIndex);
    expect(gatewayHeaders?.headers).toContainEqual({ key: "Cache-Control", value: gatewayResponseCacheControl });
  });
});
