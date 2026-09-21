/**
 * Browser API configuration shared by map rendering and place search.
 * The Google key must remain restricted to New World Cargo web origins.
 */
export const GOOGLE_MAPS_API_KEY =
  "AIzaSyDw59gPssVHEg1TcHoC9at1KDF98yVnQe4";

export const GOOGLE_MAPS_MAP_ID = "DEMO_MAP_ID";

export const API_KEYS = {
  GOOGLE_MAPS: GOOGLE_MAPS_API_KEY,
} as const;

export function getApiKey(service: keyof typeof API_KEYS): string {
  return API_KEYS[service];
}
