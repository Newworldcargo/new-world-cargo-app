import { describe, expect, it } from "vitest";
import { withinServiceArea } from "./booking-service-area";

describe("booking service areas", () => {
  it("allows Lusaka in both domestic services", () => {
    expect(withinServiceArea("local", -15.3875, 28.3228)).toBe(true);
    expect(withinServiceArea("intercity", -15.3875, 28.3228)).toBe(true);
  });
  it("allows Kitwe only for city-to-city", () => {
    expect(withinServiceArea("local", -12.8024, 28.2132)).toBe(false);
    expect(withinServiceArea("intercity", -12.8024, 28.2132)).toBe(true);
  });
  it("rejects Harare even though it falls inside Zambia's bounding rectangle", () => {
    expect(withinServiceArea("intercity", -17.8252, 31.0335)).toBe(false);
  });
  it("requires coordinates without restricting international or custom requests", () => {
    expect(withinServiceArea("local")).toBe(false);
    expect(withinServiceArea("intercity", NaN, 28)).toBe(false);
    expect(withinServiceArea("import", 25.2, 55.27)).toBe(true);
    expect(withinServiceArea("custom")).toBe(true);
  });
});
