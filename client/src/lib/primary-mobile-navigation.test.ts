import { describe, expect, it } from "vitest";
import { isPrimaryMobileTabRoute } from "./primary-mobile-navigation";

describe("primary mobile navigation routing", () => {
  it("shows the tab navigation on exact primary customer routes", () => {
    expect(isPrimaryMobileTabRoute("/")).toBe(true);
    expect(isPrimaryMobileTabRoute("/shipments")).toBe(true);
    expect(isPrimaryMobileTabRoute("/send?draft=1")).toBe(true);
    expect(isPrimaryMobileTabRoute("/payments")).toBe(true);
    expect(isPrimaryMobileTabRoute("/settings")).toBe(true);
  });

  it("hides the tab navigation on detail, workflow, support, and public routes", () => {
    expect(isPrimaryMobileTabRoute("/shipments/NWC48291ZM")).toBe(false);
    expect(isPrimaryMobileTabRoute("/settings/addresses")).toBe(false);
    expect(isPrimaryMobileTabRoute("/payments/invoices")).toBe(false);
    expect(isPrimaryMobileTabRoute("/payments/suppliers/new")).toBe(false);
    expect(isPrimaryMobileTabRoute("/notifications")).toBe(false);
    expect(isPrimaryMobileTabRoute("/track")).toBe(false);
    expect(isPrimaryMobileTabRoute("/shipments/tracking")).toBe(false);
  });
});
