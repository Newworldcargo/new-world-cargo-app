import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ContentSkeleton, PageSkeleton, MutationProgress, skeletonVariant } from "./loading-skeleton";
import { Skeleton } from "./ui/skeleton";
const state = vi.hoisted(() => ({ pending: 0 }));
vi.mock("@tanstack/react-query", () => ({ useIsMutating: () => state.pending }));

describe("reusable loading states", () => {
  it.each([["/", "dashboard"], ["/shipments", "cards"], ["/shipments/booking-5", "detail"], ["/send/import/route", "form"], ["/recover-account", "form"], ["/settings", "list"]])("matches %s to its layout", (path, variant) => {
    expect(skeletonVariant(path)).toBe(variant);
  });
  it("announces loading once and hides placeholder shapes from assistive technology", () => {
    const html = renderToStaticMarkup(<ContentSkeleton label="Loading shipments" variant="cards" rows={4} />);
    expect(html).toContain('aria-busy="true"');
    expect(html.match(/role="status"/g)).toHaveLength(1);
    expect(html).toContain('aria-label="Loading shipments"');
    expect(html).not.toContain("button");
  });
  it("supports reduced motion and a page-level fallback", () => {
    expect(renderToStaticMarkup(<Skeleton />)).toContain("motion-reduce:animate-none");
    expect(renderToStaticMarkup(<PageSkeleton path="/invoices" />)).toContain('data-loading-variant="list"');
  });
  it("only displays nonblocking mutation progress during an active write", () => {
    state.pending = 0;
    expect(renderToStaticMarkup(<MutationProgress />)).toBe("");
    state.pending = 1;
    const html = renderToStaticMarkup(<MutationProgress />);
    expect(html).toContain("Saving changes");
    expect(html).toContain("pointer-events-none");
    state.pending = 0;
  });
});
