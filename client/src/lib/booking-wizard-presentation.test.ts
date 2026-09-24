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
const routeMapSource = readFileSync(
  fileURLToPath(
    new URL("../components/booking-route-map.tsx", import.meta.url)
  ),
  "utf8"
);
const appSource = readFileSync(
  fileURLToPath(new URL("../App.tsx", import.meta.url)),
  "utf8"
);
const apiKeysSource = readFileSync(
  fileURLToPath(new URL("../config/api-keys.ts", import.meta.url)),
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

  it("checks the configured pricing mode for every standard booking service", () => {
    expect(wizardSource).toContain(
      'return service === "local" || service === "import" || service === "intercity"'
    );
    expect(wizardSource).toContain(
      'apiRequest<BookingQuote>("/bookings/quote"'
    );
    expect(wizardSource).toContain("quotePayload: quote.quotePayload");
    expect(wizardSource).toContain("quoteSignature: quote.quoteSignature");
    expect(wizardSource).toContain("quoteSource: quote.source");
    expect(wizardSource).toContain('"Submit booking request"');
    expect(wizardSource).toContain('"pending_operations_pricing"');
    expect(wizardSource).toContain('Our team will confirm the price before payment.');
  });

  it("keeps route maps wired into booking requests", () => {
    expect(wizardSource).toContain("BookingRouteMap");
    expect(wizardSource).toContain("pickupLatitude");
    expect(wizardSource).toContain("destinationLongitude");
    expect(wizardSource).toContain("xl:grid-cols-2");
    expect(wizardSource).toContain('mode="map"');
    expect(wizardSource).toContain('mode="fields"');
    expect(routeMapSource).toContain("maps.googleapis.com/maps/api/js");
    expect(routeMapSource).toContain(
      'import { GOOGLE_MAPS_API_KEY } from "@/config/api-keys"'
    );
    expect(wizardSource).toContain(
      'import { GOOGLE_MAPS_API_KEY } from "@/config/api-keys"'
    );
    expect(apiKeysSource).toContain("export const GOOGLE_MAPS_API_KEY");
    expect(routeMapSource).toContain("DirectionsService");
    expect(routeMapSource).toContain("Geocoder");
    expect(routeMapSource).toContain("navigator.geolocation");
    expect(routeMapSource).toContain(
      "Interactive map is temporarily unavailable"
    );
    expect(routeMapSource).not.toContain("Google Maps key is not configured");
  });
});
