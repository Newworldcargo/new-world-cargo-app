import { describe, expect, it } from "vitest";
import { PUBLIC_TRACKING_RAILS, PUBLIC_TRACKING_SERVICES } from "./public-tracking-campaigns";

describe("public tracking campaigns", () => {
  it("defines two compact service cards below tracking", () => {
    expect(PUBLIC_TRACKING_SERVICES).toHaveLength(2);
    expect(PUBLIC_TRACKING_SERVICES.every((service) => service.detail.length < 100)).toBe(true);
  });

  it("defines two distinct first-party desktop campaign rails", () => {
    expect(PUBLIC_TRACKING_RAILS.left.title).not.toBe(PUBLIC_TRACKING_RAILS.right.title);
    expect(PUBLIC_TRACKING_RAILS.left.detail).toContain("campaign space");
    expect(PUBLIC_TRACKING_RAILS.right.detail).toContain("campaign space");
  });
});

