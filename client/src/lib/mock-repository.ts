/** Small replaceable persistence boundary for frontend-only customer workflows. */
const serverFallback = new Map<string, string>();

function storage() {
  return typeof window === "undefined" ? serverFallback : window.localStorage;
}

export function readMockRecord<T>(key: string, fallback: T): T {
  try {
    const target = storage();
    const raw = target instanceof Map ? target.get(key) : target.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

export function writeMockRecord<T>(key: string, value: T): void {
  const serialized = JSON.stringify(value);
  const target = storage();
  if (target instanceof Map) target.set(key, serialized);
  else target.setItem(key, serialized);
}
