import { describe, expect, it } from "vitest";
import { PUBLIC_TRACKING_PROMOTIONS } from "./public-tracking-promotions";

describe("public tracking promotions", () => {
  it("keeps service discovery limited to two concise, non-tracking cards", () => {
    expect(PUBLIC_TRACKING_PROMOTIONS).toHaveLength(2);
    expect(PUBLIC_TRACKING_PROMOTIONS.map((promotion) => promotion.eyebrow)).toEqual(["Sea freight", "Warehouse support"]);
    expect(PUBLIC_TRACKING_PROMOTIONS.every((promotion) => promotion.detail.length < 100)).toBe(true);
  });
});
