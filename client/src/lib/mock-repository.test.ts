import { describe, expect, it } from "vitest";
import { readMockRecord, writeMockRecord } from "./mock-repository";

describe("mock repository", () => {
  it("returns the fallback for unavailable records", () => {
    expect(readMockRecord("missing", ["fallback"])).toEqual(["fallback"]);
  });

  it("round-trips local customer workflow records", () => {
    writeMockRecord("draft", { step: 2, reference: "NWC90418ZM" });
    expect(readMockRecord("draft", { step: 0, reference: "" })).toEqual({ step: 2, reference: "NWC90418ZM" });
  });
});
