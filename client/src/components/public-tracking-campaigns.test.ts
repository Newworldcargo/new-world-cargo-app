import { describe, expect, it } from "vitest";
import { PUBLIC_TRACKING_CAMPAIGNS } from "./public-tracking-campaigns";

describe("public tracking campaigns", () => {
  it("defines one first-party banner and two distinct desktop side campaigns", () => {
    expect(PUBLIC_TRACKING_CAMPAIGNS.banner.title).toBeTruthy();
    expect(PUBLIC_TRACKING_CAMPAIGNS.left.eyebrow).not.toBe(PUBLIC_TRACKING_CAMPAIGNS.right.eyebrow);
    expect(PUBLIC_TRACKING_CAMPAIGNS.left.detail.length).toBeLessThan(100);
    expect(PUBLIC_TRACKING_CAMPAIGNS.right.detail.length).toBeLessThan(100);
  });
});
