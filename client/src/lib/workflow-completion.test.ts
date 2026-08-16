import { describe, expect, it } from "vitest";
import { canModifyShipment, matchesTrackingNumber, shouldMockPaymentFail } from "./workflow-completion";

describe("workflow completion helpers", () => {
  it("keeps failed payment simulation explicit and retryable", () => {
    expect(shouldMockPaymentFail("+260 977 123 000")).toBe(true);
    expect(shouldMockPaymentFail("4111 1111 1111 1111")).toBe(false);
  });

  it("only permits shipment changes while operationally eligible", () => {
    expect(canModifyShipment("in_transit")).toBe(true);
    expect(canModifyShipment("delivered")).toBe(false);
    expect(canModifyShipment("in_transit", true)).toBe(false);
  });

  it("matches public tracking numbers without case or whitespace sensitivity", () => {
    expect(matchesTrackingNumber("NWC48291ZM", " nwc48291zm ")).toBe(true);
    expect(matchesTrackingNumber("NWC48291ZM", "NWC00000ZM")).toBe(false);
  });
});
