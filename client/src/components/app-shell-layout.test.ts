import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const appShellSource = readFileSync(fileURLToPath(new URL("./app-shell.tsx", import.meta.url)), "utf8");
const homeSource = readFileSync(fileURLToPath(new URL("../pages/Home.tsx", import.meta.url)), "utf8");

describe("desktop portal shell layout", () => {
  it("keeps the desktop sidebar fixed while reserving its width for page content", () => {
    expect(appShellSource).toContain("lg:pl-[236px]");
    expect(appShellSource).toContain("fixed inset-y-0 left-0");
  });

  it("allows the sidebar itself to scroll only when its content overflows", () => {
    expect(appShellSource).toContain("overflow-y-auto overscroll-contain");
    expect(appShellSource).not.toContain("sticky top-0 hidden h-screen w-[236px]");
  });

  it("preserves sidebar scroll state and uses visible content sections to update the navigation highlight", () => {
    expect(appShellSource).toContain("sidebarScrollPositions");
    expect(appShellSource).toContain("data-sidebar-section");
    expect(appShellSource).toContain("window.addEventListener(\"scroll\"");
  });

  it("provides an accessible compact collapse control for smaller laptop viewports", () => {
    expect(appShellSource).toContain("PanelLeftClose");
    expect(appShellSource).toContain("PanelLeftOpen");
    expect(appShellSource).toContain("lg:grid xl:hidden");
    expect(appShellSource).toContain("aria-label={sidebarCollapsed ? \"Expand navigation\" : \"Collapse navigation\"}");
  });

  it("marks the dashboard regions that can drive scroll-aware navigation highlighting", () => {
    expect(homeSource).toContain('data-sidebar-section="/"');
    expect(homeSource).toContain('data-sidebar-section="/shipments"');
    expect(homeSource).toContain('data-sidebar-section="/invoices"');
    expect(homeSource).toContain('data-sidebar-section="/send"');
  });
});
