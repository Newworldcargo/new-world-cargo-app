import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const settingsPageSource = readFileSync(fileURLToPath(new URL("../pages/Settings.tsx", import.meta.url)), "utf8");
const mobileNavigationSource = readFileSync(fileURLToPath(new URL("../components/mobile-bottom-navigation.tsx", import.meta.url)), "utf8");

describe("minimalist settings presentation", () => {
  it("keeps Settings focused by omitting the removed badge, subtitle, and control banner", () => {
    expect(settingsPageSource).not.toContain("Customer settings");
    expect(settingsPageSource).not.toContain("Account ready");
    expect(settingsPageSource).not.toContain("Account control rail");
  });

  it("positions the reusable mobile tab bar above the screen edge", () => {
    expect(mobileNavigationSource).toContain("bottom-7");
  });
});
