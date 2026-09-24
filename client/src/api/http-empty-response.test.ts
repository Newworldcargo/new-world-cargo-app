import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "./http";

afterEach(() => vi.unstubAllGlobals());

describe("empty API responses", () => {
  it("accepts the empty 204 response from logout", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 200, headers: { "X-CSRF-Token": "test" } }))
      .mockResolvedValueOnce(new Response(null, { status: 204 })));
    await expect(apiRequest("/auth/logout", { method: "POST" })).resolves.toBeNull();
  });
  it("still unwraps JSON data", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: { id: "test" } }))));
    await expect(apiRequest("/session")).resolves.toEqual({ id: "test" });
  });
});
