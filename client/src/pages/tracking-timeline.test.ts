import { describe, expect, it } from "vitest";
import {
  getTrackingTimelineConnectorClass,
  isTrackingTimelineSegmentComplete,
  PUBLIC_TRACKING_SIGN_IN_LABEL,
  shouldRenderTrackingConnector,
  TRACKING_TIMELINE_CONNECTOR_CLASS,
} from "./Tracking";

describe("public tracking mapped timeline", () => {
  it("connects each timeline circle except the final destination step", () => {
    expect(shouldRenderTrackingConnector(0, 4)).toBe(true);
    expect(shouldRenderTrackingConnector(2, 4)).toBe(true);
    expect(shouldRenderTrackingConnector(3, 4)).toBe(false);
  });

  it("uses a vertical dashed connector that sits behind status circles", () => {
    expect(TRACKING_TIMELINE_CONNECTOR_CLASS).toContain("border-dashed");
    expect(TRACKING_TIMELINE_CONNECTOR_CLASS).toContain("border-l-[3px]");
  });

  it("uses Cargo Yellow for completed route segments and light grey for upcoming segments", () => {
    expect(getTrackingTimelineConnectorClass(true)).toContain("border-cargo-yellow");
    expect(getTrackingTimelineConnectorClass(false)).toContain("border-ink/20");
  });

  it("keeps every completed or current journey leg visibly yellow", () => {
    const events = [
      { complete: true },
      { complete: true },
      { current: true },
      {},
    ];

    expect(isTrackingTimelineSegmentComplete(events, 0)).toBe(true);
    expect(isTrackingTimelineSegmentComplete(events, 1)).toBe(true);
    expect(isTrackingTimelineSegmentComplete(events, 2)).toBe(true);
  });

  it("keeps the sign-in control labelled for an account affordance", () => {
    expect(PUBLIC_TRACKING_SIGN_IN_LABEL).toBe("Sign in to your account");
  });
});
