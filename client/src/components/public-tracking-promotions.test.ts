import { describe, expect, it } from "vitest";
import { PUBLIC_TRACKING_PROMOTIONS } from "./public-tracking-promotions";

describe("public tracking promotions", () => {
  it("keeps service discovery limited to two concise, image-backed cards", () => {
    expect(PUBLIC_TRACKING_PROMOTIONS).toHaveLength(2);
    expect(PUBLIC_TRACKING_PROMOTIONS.map((promotion) => promotion.eyebrow)).toEqual(["Air cargo", "Warehouse support"]);
    expect(PUBLIC_TRACKING_PROMOTIONS.every((promotion) => promotion.detail.length < 100)).toBe(true);
    expect(PUBLIC_TRACKING_PROMOTIONS.every((promotion) => promotion.imageSrc.startsWith("/manus-storage/"))).toBe(true);
    expect(PUBLIC_TRACKING_PROMOTIONS.every((promotion) => promotion.imageAlt.length > 10)).toBe(true);
  });
});
