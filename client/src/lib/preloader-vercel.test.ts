import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { APP_PRELOADER_LABEL } from "@/components/async-state";

const root = new URL("../../..", import.meta.url);
const readProjectFile = (name: string) => readFileSync(new URL(name, root), "utf8");

describe("preloader and Vercel deployment contract", () => {
  it("exposes the branded app preloader label", () => {
    expect(APP_PRELOADER_LABEL).toBe("Loading New World Cargo…");
  });

  it("keeps the brand lockup host-independent for Vercel", () => {
    const brandMark = readProjectFile("client/src/components/BrandMark.tsx");
    const html = readProjectFile("client/index.html");

    expect(brandMark).toContain('src="/manus-storage/new-world-cargo-logo_7e9d1949.png"');
    expect(html).toContain('href="/favicon.ico"');
  });

  it("keeps the Vercel output and SPA fallback aligned with the Vite build", () => {
    const config = JSON.parse(readProjectFile("vercel.json")) as {
      framework: string;
      buildCommand: string;
      outputDirectory: string;
      rewrites: Array<{ source: string; destination: string }>;
    };

    expect(config.framework).toBe("vite");
    expect(config.buildCommand).toBe("pnpm build");
    expect(config.outputDirectory).toBe("dist/public");
    expect(config.rewrites).toContainEqual({ source: "/(.*)", destination: "/index.html" });
  });
});
