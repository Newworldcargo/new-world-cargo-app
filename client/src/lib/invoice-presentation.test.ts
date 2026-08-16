import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const invoicesPageSource = readFileSync(fileURLToPath(new URL("../pages/Invoices.tsx", import.meta.url)), "utf8");

describe("minimalist invoice presentation", () => {
  it("omits the redundant cargo billing route banner from the invoice list", () => {
    expect(invoicesPageSource).not.toContain("Cargo billing route");
    expect(invoicesPageSource).not.toContain("Billing active");
  });

  it("places a yellow package icon alongside shipment contents in opened invoice details", () => {
    expect(invoicesPageSource).toContain('bg-cargo-yellow text-ink"><Package');
  });
});
