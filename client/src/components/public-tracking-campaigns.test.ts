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

  it("uses stable first-party visual assets and the default navy card surface", () => {
    expect(PUBLIC_TRACKING_BRAND_ASSETS.logo).toBe("/new-world-cargo-logo.png");
    expect(PUBLIC_TRACKING_BRAND_ASSETS.campaignSquare).toBe("https://www.newworldcargo.com/images/home1.webp");
    expect(PUBLIC_TRACKING_CARD_THEME.surfaceClass).toBe("bg-[#012642]");
  });

  it("provides the supplied courier advert above the cargo animation for the left campaign rail", () => {
    expect(PUBLIC_TRACKING_BRAND_ASSETS.courierServicesAd).toBe("https://www.newworldcargo.com/images/home1.webp");
    expect(PUBLIC_TRACKING_BRAND_ASSETS.airCargoAnimation).toBe("https://www.newworldcargo.com/images/home1.webp");
  });
});
