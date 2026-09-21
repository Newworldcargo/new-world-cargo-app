import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import type { Feature, Polygon, MultiPolygon } from "geojson";
import areas from "@/config/booking-service-areas.json";

export function serviceArea(service: string) {
  return service === "local" || service === "intercity" ? areas[service] : null;
}

export function withinServiceArea(service: string, latitude?: number, longitude?: number): boolean {
  const area = serviceArea(service);
  if (!area) return true;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;
  return booleanPointInPolygon([longitude!, latitude!], area as Feature<Polygon | MultiPolygon>);
}

export function serviceAreaMessage(service: string): string {
  return service === "local" ? "Local delivery is currently available within Lusaka only. Choose both locations in Lusaka."
    : "City-to-city delivery is available within Zambia only. Choose both locations in Zambia.";
}
