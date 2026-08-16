import { describe, expect, it } from "vitest";
import { legalPolicySlugs, policies } from "@/pages/Legal";

describe("legal settings policy catalog", () => {
  it("includes the policy pages needed for customer and store readiness", () => {
    expect(legalPolicySlugs).toEqual([
      "privacy",
      "terms",
      "shipping",
      "returns",
      "payments",
      "acceptable-use",
    ]);
    expect(policies).toHaveLength(6);
    expect(policies.every((policy) => policy.title && policy.detail)).toBe(true);
  });
});
