import { describe, expect, it, vi } from "vitest";
import { createPlaceSearch, searchWithRelaxedQuery } from "./location-search";

const places = [
  { name: "Lusaka office", city: "Lusaka", address: "Cairo Road, Zambia" },
  { name: "Dubai office", city: "Dubai", address: "United Arab Emirates" },
  { name: "Kitwe office", city: "Kitwe", address: "Zambia" },
];
describe("forgiving location search", () => {
  it.each([['rueir dubai', 'Dubai office'], ['lusaka lklk', 'Lusaka office'], ['luskaa', 'Lusaka office'], ['duabi', 'Dubai office'], ['DUBAI!!!', 'Dubai office']])("ranks %s correctly", (query, name) => {
    expect(createPlaceSearch(places)(query)[0]?.name).toBe(name);
  });
  it("does not invent results for unrelated text", () => {
    expect(createPlaceSearch(places)('zzzzzzzz')).toEqual([]);
    expect(createPlaceSearch(places)('')).toEqual(places);
  });
  it("broadens empty live results without replacing a successful full query", async () => {
    const search = vi.fn(async (query: string) => query === 'lusaka' ? ['Lusaka'] : []);
    expect(await searchWithRelaxedQuery('lusaka lklk', search)).toEqual(['Lusaka']);
    expect(search.mock.calls.map(([query]) => query)).toEqual(['lusaka lklk', 'lusaka']);
    search.mockClear();
    await searchWithRelaxedQuery('lusaka', search);
    expect(search).toHaveBeenCalledTimes(1);
  });
  it("limits retries and does not retry provider errors", async () => {
    const empty = vi.fn(async () => []);
    await searchWithRelaxedQuery('one two three four', empty);
    expect(empty).toHaveBeenCalledTimes(3);
    const failure = vi.fn(async () => { throw new Error('Unavailable'); });
    await expect(searchWithRelaxedQuery('lusaka lklk', failure)).rejects.toThrow('Unavailable');
    expect(failure).toHaveBeenCalledTimes(1);
  });
  it("stops abandoned searches before starting another request", async () => {
    const controller = new AbortController();
    const search = vi.fn(async () => { controller.abort(); return []; });
    await expect(searchWithRelaxedQuery('lusaka lklk', search, controller.signal)).rejects.toThrow();
    expect(search).toHaveBeenCalledTimes(1);
  });
});
