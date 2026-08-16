import { describe, expect, it } from "vitest";
import { markDefaultAddress, removeSavedAddress, signInActivityRoute } from "./settings-workflow";
import type { Address } from "./domain";

const sample: Address[] = [
  { id: "home", label: "Home", line: "Plot 18", landmark: "Arcades", default: true },
  { id: "office", label: "Office", line: "Shop 62", landmark: "Great East Road" },
];

describe("Settings workflows", () => {
  it("marks exactly one saved address as default", () => {
    const result = markDefaultAddress(sample, "office");
    expect(result.find(address => address.id === "office")?.default).toBe(true);
    expect(result.find(address => address.id === "home")?.default).toBe(false);
  });

  it("promotes the first remaining address after deleting the default", () => {
    const result = removeSavedAddress(sample, "home");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("office");
    expect(result[0].default).toBe(true);
  });

  it("keeps the dedicated sign-in activity route stable", () => {
    expect(signInActivityRoute()).toBe("/settings/security/activity");
  });
});
