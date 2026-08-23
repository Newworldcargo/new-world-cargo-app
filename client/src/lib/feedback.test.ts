import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("customer feedback conventions", () => {
  it("defines one reusable success, information, warning, error, and error-normalization vocabulary", () => {
    const feedback = readFileSync(resolve(root, "client/src/lib/feedback.ts"), "utf8");
    expect(feedback).toContain("success:");
    expect(feedback).toContain("info:");
    expect(feedback).toContain("warning:");
    expect(feedback).toContain("error:");
    expect(feedback).toContain("fromError:");
    expect(feedback).toContain("NETWORK_UNAVAILABLE");
    expect(feedback).toContain("REQUEST_TIMEOUT");
  });

  it("keeps a globally available, dismissible feedback surface outside the page error boundary", () => {
    const app = readFileSync(resolve(root, "client/src/App.tsx"), "utf8");
    const sonner = readFileSync(resolve(root, "client/src/components/ui/sonner.tsx"), "utf8");
    expect(app.indexOf("<Toaster")).toBeLessThan(app.indexOf("<ErrorBoundary>"));
    expect(sonner).toContain("closeButton");
    expect(sonner).toContain("richColors");
  });

  it("reports mutation failures and offline transitions while preserving inline accessible page states", () => {
    const queryClient = readFileSync(resolve(root, "client/src/api/query-client.ts"), "utf8");
    const asyncState = readFileSync(resolve(root, "client/src/components/async-state.tsx"), "utf8");
    expect(queryClient).toContain("MutationCache");
    expect(queryClient).toContain("feedback.fromError(error)");
    expect(asyncState).toContain("export function ErrorState");
    expect(asyncState).toContain("feedback.warning(\"You are offline\"");
    expect(asyncState).toContain("feedback.success(\"You are back online\"");
  });

  it("uses the shared feedback API in representative customer workflow pages and components", () => {
    const paths = [
      "client/src/components/app-shell.tsx",
      "client/src/components/payment-modal.tsx",
      "client/src/components/shipment-ui.tsx",
      "client/src/pages/Home.tsx",
      "client/src/pages/Invoices.tsx",
      "client/src/pages/SendShipment.tsx",
      "client/src/pages/ShipmentDetail.tsx",
    ];
    for (const path of paths) {
      const source = readFileSync(resolve(root, path), "utf8");
      expect(source).toContain("feedback");
      expect(source).not.toContain('from "sonner"');
    }
  });
});
