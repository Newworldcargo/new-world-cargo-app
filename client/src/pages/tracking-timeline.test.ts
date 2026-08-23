import { describe, expect, it } from "vitest";
import { shouldRenderTrackingConnector, TRACKING_TIMELINE_CONNECTOR_CLASS } from "./Tracking";

describe("public tracking mapped timeline", () => {
  it("connects each timeline circle except the final destination step", () => {
    expect(shouldRenderTrackingConnector(0, 4)).toBe(true);
    expect(shouldRenderTrackingConnector(2, 4)).toBe(true);
    expect(shouldRenderTrackingConnector(3, 4)).toBe(false);
  });

  it("uses a vertical dashed navy connector that sits behind status circles", () => {
    expect(TRACKING_TIMELINE_CONNECTOR_CLASS).toContain("border-dashed");
    expect(TRACKING_TIMELINE_CONNECTOR_CLASS).toContain("border-l-2");
    expect(TRACKING_TIMELINE_CONNECTOR_CLASS).toContain("border-[#012642]/35");
  });
});

