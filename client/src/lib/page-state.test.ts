import { describe, expect, it } from "vitest";
import { getCustomerPageState } from "./page-state";

describe("getCustomerPageState", () => {
  it("accepts supported state previews", () => {
    expect(getCustomerPageState("?state=loading")).toBe("loading");
    expect(getCustomerPageState("?state=empty")).toBe("empty");
    expect(getCustomerPageState("?state=error")).toBe("error");
  });

  it("keeps normal customer content visible for unknown or absent values", () => {
    expect(getCustomerPageState("")).toBe("content");
    expect(getCustomerPageState("?state=offline")).toBe("content");
  });
});
