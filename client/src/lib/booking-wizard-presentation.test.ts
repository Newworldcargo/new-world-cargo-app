import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const gridSource = readFileSync(
  fileURLToPath(
    new URL("../components/booking-service-grid.tsx", import.meta.url)
  ),
  "utf8"
);
const wizardSource = readFileSync(
  fileURLToPath(new URL("../pages/BookingWizard.tsx", import.meta.url)),
  "utf8"
);
const appSource = readFileSync(
  fileURLToPath(new URL("../App.tsx", import.meta.url)),
  "utf8"
);

describe("service-specific booking wizards", () => {
  it("opens each service on its own route workflow", () => {
    expect(gridSource).toContain('import: "/send/import/route"');
    expect(gridSource).toContain('intercity: "/send/intercity/route"');
    expect(gridSource).toContain('local: "/send/local/route"');
    expect(gridSource).toContain('custom: "/send/custom/route"');
    expect(appSource).toContain(
      '<Route path="/send/:service/:stage" component={BookingWizard}'
    );
    expect(appSource).toContain(
      "if (!sessionLoading && !isAuthenticated && !isPublic)"
    );
  });

  it("keeps the mobile stage structure for all four services", () => {
    expect(wizardSource).toMatch(/local:\s*{\s*label: "Local Delivery"/);
    expect(wizardSource).toMatch(/intercity:\s*{\s*label: "City-to-City"/);
    expect(wizardSource).toMatch(
      /import:\s*{\s*label: "International Imports"/
    );
    expect(wizardSource).toMatch(/custom:\s*{\s*label: "Custom Request"/);
    expect(wizardSource).toMatch(/id: "fulfilment",\s*label: "Collection"/);
    expect(wizardSource).toMatch(/id: "receiver",\s*label: "Receiver"/);
    expect(wizardSource).toMatch(/id: "details",\s*label: "Details"/);
  });

  it("submits only server-signed booking quotes", () => {
    expect(wizardSource).toContain(
      'apiRequest<BookingQuote>("/bookings/quote"'
    );
    expect(wizardSource).toContain("quotePayload: quote.quotePayload");
    expect(wizardSource).toContain("quoteSignature: quote.quoteSignature");
    expect(wizardSource).toContain("quoteSource: quote.source");
  });
});
