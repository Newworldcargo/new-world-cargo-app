import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const appShellSource = readFileSync(fileURLToPath(new URL("./app-shell.tsx", import.meta.url)), "utf8");

describe("desktop portal shell layout", () => {
  it("keeps the desktop sidebar fixed while reserving its width for page content", () => {
    expect(appShellSource).toContain("lg:pl-[236px]");
    expect(appShellSource).toContain("fixed inset-y-0 left-0");
  });

  it("allows the sidebar itself to scroll only when its content overflows", () => {
    expect(appShellSource).toContain("overflow-y-auto overscroll-contain");
    expect(appShellSource).not.toContain("sticky top-0 hidden h-screen w-[236px]");
  });
});

