import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const sendShipmentPageSource = readFileSync(fileURLToPath(new URL("../pages/SendShipment.tsx", import.meta.url)), "utf8");

describe("minimalist Send Shipment presentation", () => {
  it("retains the labelled progress line without showing a numeric step count", () => {
    expect(sendShipmentPageSource).toContain("steps.map");
    expect(sendShipmentPageSource).not.toContain("of {steps.length}");
  });

  it("uses concise step headings without explanatory subtitle props", () => {
    expect(sendShipmentPageSource).not.toContain("subtitle=");
    expect(sendShipmentPageSource).not.toContain("title, subtitle, children");
  });
});
