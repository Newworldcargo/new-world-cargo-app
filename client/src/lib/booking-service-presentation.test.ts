import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const gridSource = readFileSync(
  fileURLToPath(
    new URL("../components/booking-service-grid.tsx", import.meta.url)
  ),
  "utf8"
);
const sendSource = readFileSync(
  fileURLToPath(new URL("../pages/SendShipment.tsx", import.meta.url)),
  "utf8"
);

describe("mobile booking service presentation", () => {
  it("offers the same customer booking choices as the mobile home", () => {
    expect(gridSource).toContain("International Imports");
    expect(gridSource).toContain("City-to-City");
    expect(gridSource).toContain("Local Delivery");
    expect(gridSource).toContain("Custom Request");
    expect(gridSource).toContain("BookingServiceGrid");
    expect(gridSource).not.toContain('role="tablist"');
    expect(sendSource).not.toContain("BookingServiceTabs");
  });

  it("preserves the selected service in the server draft payload", () => {
    expect(sendSource).toContain("const draftPayload");
    expect(sendSource).toContain(
      'transportMode: service === "import" ? transport : null'
    );
    expect(sendSource).toContain("payload: draftPayload()");
    expect(sendSource).toContain('apiRequest<BookingQuote>("/bookings/quote"');
    expect(sendSource).toContain("quoteSignature: quote.quoteSignature");
  });
});
