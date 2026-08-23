import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("frontend infrastructure hardening", () => {
  it("bounds API requests and supports CSRF plus normalized offline failures", () => {
    const transport = readFileSync(resolve(root, "client/src/api/http.ts"), "utf8");
    expect(transport).toContain("apiRequestTimeoutMs");
    expect(transport).toContain("X-CSRF-Token");
    expect(transport).toContain("NETWORK_UNAVAILABLE");
    expect(transport).toContain("REQUEST_TIMEOUT");
  });

  it("sets baseline browser security headers for the static deployment", () => {
    const config = JSON.parse(readFileSync(resolve(root, "vercel.json"), "utf8")) as { headers: Array<{ source: string; headers: Array<{ key: string; value: string }> }> };
    const common = config.headers.find((entry) => entry.source === "/(.*)");
    expect(common?.headers).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: "X-Content-Type-Options", value: "nosniff" }),
      expect.objectContaining({ key: "X-Frame-Options", value: "DENY" }),
      expect.objectContaining({ key: "Content-Security-Policy" }),
    ]));
  });

  it("validates and cleans up profile-photo previews before direct uploads", () => {
    const page = readFileSync(resolve(root, "client/src/pages/ProfilePhoto.tsx"), "utf8");
    expect(page).toContain("MAX_PROFILE_PHOTO_BYTES");
    expect(page).toContain("URL.revokeObjectURL");
    expect(page).toContain("PROFILE_PHOTO_TYPES");
  });

  it("loads customer routes on demand instead of bundling every workflow at boot", () => {
    const app = readFileSync(resolve(root, "client/src/App.tsx"), "utf8");
    const vite = readFileSync(resolve(root, "vite.config.ts"), "utf8");
    expect(app).toContain("lazy(() => import(");
    expect(app).toContain("<Suspense fallback={<AppPreloader");
    expect(vite).toContain("manualChunks");
    expect(vite).toContain('"vendor-react"');
  });

  it("exposes a static liveness response before the SPA fallback on Vercel", () => {
    const vercel = readFileSync(resolve(root, "vercel.json"), "utf8");
    const health = readFileSync(resolve(root, "client/public/health.json"), "utf8");
    expect(vercel).toContain('"source": "/healthz"');
    expect(vercel.indexOf('"source": "/healthz"')).toBeLessThan(vercel.indexOf('"source": "/(.*)"'));
    expect(health).toContain('"status": "ok"');
  });
});
