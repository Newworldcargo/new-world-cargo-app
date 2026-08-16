import { mobileNavigationItemClass } from "./navigation-style";
import { describe, expect, it } from "vitest";

describe("mobile navigation styling", () => {
  it("keeps inactive navigation links solid white on the navy navigation surface", () => {
    const styles = mobileNavigationItemClass(false);
    expect(styles).toContain("text-white");
    expect(styles).not.toContain("text-white/");
  });

  it("keeps the active navigation link in Cargo Yellow", () => {
    expect(mobileNavigationItemClass(true)).toContain("text-cargo-yellow");
  });
});
