import { describe, expect, it } from "vitest";
import {
  PUBLIC_TRACKING_BRAND_ASSETS,
  PUBLIC_TRACKING_CARD_THEME,
  PUBLIC_TRACKING_RAILS,
  PUBLIC_TRACKING_SERVICES,
} from "./public-tracking-campaigns";

describe("public tracking campaigns", () => {
  it("defines two compact service cards below tracking", () => {
    expect(PUBLIC_TRACKING_SERVICES).toHaveLength(2);
    expect(PUBLIC_TRACKING_SERVICES.every((service) => service.detail.length < 100)).toBe(true);
  });

  it("defines two distinct first-party desktop campaign rails", () => {
    expect(PUBLIC_TRACKING_RAILS.left.title).not.toBe(PUBLIC_TRACKING_RAILS.right.title);
    expect(PUBLIC_TRACKING_RAILS.left.detail).toContain("cargo shipment");
    expect(PUBLIC_TRACKING_RAILS.right.detail).toContain("campaign space");
    expect(PUBLIC_TRACKING_RAILS.left.imageUrl).toBe(PUBLIC_TRACKING_BRAND_ASSETS.campaignWarehouse);
    expect(PUBLIC_TRACKING_RAILS.right.imageUrl).toBe(PUBLIC_TRACKING_BRAND_ASSETS.campaignSquare);
  });

  it("uses uploaded official visual assets and the default navy card surface", () => {
    expect(PUBLIC_TRACKING_BRAND_ASSETS.logo).toMatch(/^\/manus-storage\/new-world-cargo-tracking-logo_/);
    expect(PUBLIC_TRACKING_BRAND_ASSETS.campaignSquare).toMatch(/^\/manus-storage\/new-world-cargo-campaign-111_/);
    expect(PUBLIC_TRACKING_CARD_THEME.surfaceClass).toBe("bg-[#012642]");
  });
});
