import Fuse from "fuse.js";

type SearchablePlace = { name: string; address?: string | null; city?: string | null; country?: string | null };

export function createPlaceSearch<T extends SearchablePlace>(places: T[]) {
  const fuse = new Fuse(places, {
    keys: [{ name: "name", weight: 3 }, { name: "city", weight: 2 }, "address", "country"],
    useTokenSearch: true,
    tokenMatch: "any",
    threshold: 0.4,
    ignoreLocation: true,
    ignoreDiacritics: true,
  });
  return (query: string, limit = 5): T[] => query.trim()
    ? fuse.search(query.trim(), { limit }).map(result => result.item)
    : places.slice(0, limit);
}

export async function searchWithRelaxedQuery<T>(query: string, search: (query: string) => Promise<T[]>, signal?: AbortSignal): Promise<T[]> {
  const words = query.trim().split(/\s+/);
  // Retry at most twice, and only after a successful search returns no places.
  const candidates = Array.from(new Set([words.join(" "), words.slice(0, -1).join(" "), words.slice(1).join(" ")]))
    .filter(candidate => candidate.length >= 3);
  for (const candidate of candidates) {
    signal?.throwIfAborted();
    const results = await search(candidate);
    signal?.throwIfAborted();
    if (results.length) return results;
  }
  return [];
}
