import "leaflet/dist/leaflet.css";

import { Crosshair, MapPin, Navigation } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { LatLngExpression, LatLngTuple } from "leaflet";

export type RouteMapPoint = {
  label: string;
  latitude?: number;
  longitude?: number;
};

export type RouteMapOffice = RouteMapPoint & {
  id: string;
  name: string;
  address: string;
};

type RouteTarget = "pickup" | "destination";

const lusaka: LatLngTuple = [-15.3875, 28.3228];

function coordinates(point?: RouteMapPoint): LatLngTuple | null {
  if (!Number.isFinite(point?.latitude) || !Number.isFinite(point?.longitude)) {
    return null;
  }
  return [point!.latitude!, point!.longitude!];
}

function MapViewport({
  points,
  fallback,
}: {
  points: LatLngTuple[];
  fallback: LatLngTuple;
}) {
  const map = useMap();

  useEffect(() => {
    if (points.length > 1) {
      map.fitBounds(points, { padding: [42, 42], maxZoom: 14 });
    } else if (points.length === 1) {
      map.flyTo(points[0], 14, { duration: 0.55 });
    } else {
      map.setView(fallback, 6);
    }
  }, [fallback, map, points]);

  return null;
}

function MapClick({ onSelect }: { onSelect: (point: LatLngTuple) => void }) {
  useMapEvents({
    click(event) {
      onSelect([event.latlng.lat, event.latlng.lng]);
    },
  });
  return null;
}

async function locationLabel([latitude, longitude]: LatLngTuple) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
      { headers: { Accept: "application/json" } }
    );
    if (!response.ok) throw new Error("Reverse geocoding failed");
    const result = (await response.json()) as { display_name?: string };
    return (
      result.display_name?.trim() ||
      `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
    );
  } catch {
    return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
  }
}

export function BookingRouteMap({
  pickup,
  destination,
  offices = [],
  international = false,
  allowMapSelection = true,
  onPointSelect,
}: {
  pickup: RouteMapPoint;
  destination: RouteMapPoint;
  offices?: RouteMapOffice[];
  international?: boolean;
  allowMapSelection?: boolean;
  onPointSelect: (target: RouteTarget, point: Required<RouteMapPoint>) => void;
}) {
  const [target, setTarget] = useState<RouteTarget>(
    pickup.label ? "destination" : "pickup"
  );
  const [locating, setLocating] = useState(false);
  const pickupCoordinates = coordinates(pickup);
  const destinationCoordinates = coordinates(destination);
  const officeCoordinates = useMemo(
    () =>
      offices.flatMap(office => {
        const value = coordinates(office);
        return value ? [{ office, value }] : [];
      }),
    [offices]
  );
  const visiblePoints = useMemo(
    () =>
      [
        pickupCoordinates,
        destinationCoordinates,
        ...officeCoordinates.map(item => item.value),
      ].filter((point): point is LatLngTuple => Boolean(point)),
    [destinationCoordinates, officeCoordinates, pickupCoordinates]
  );
  const fallback = international ? ([2, 35] as LatLngTuple) : lusaka;

  const select = async (selectedTarget: RouteTarget, point: LatLngTuple) => {
    const label = await locationLabel(point);
    onPointSelect(selectedTarget, {
      label,
      latitude: point[0],
      longitude: point[1],
    });
    setTarget(selectedTarget === "pickup" ? "destination" : "pickup");
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      position => {
        void select("pickup", [
          position.coords.latitude,
          position.coords.longitude,
        ]).finally(() => setLocating(false));
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  };

  return (
    <section
      className="relative h-[340px] min-h-[340px] overflow-hidden rounded-2xl border border-ink/10 bg-[#dfe8e9] sm:h-[420px]"
      aria-label="Booking route map"
    >
      <MapContainer
        center={fallback as LatLngExpression}
        zoom={international ? 3 : 6}
        className="h-full w-full"
        zoomControl={false}
        attributionControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapViewport points={visiblePoints} fallback={fallback} />
        {allowMapSelection && (
          <MapClick onSelect={point => void select(target, point)} />
        )}
        {pickupCoordinates && (
          <CircleMarker
            center={pickupCoordinates}
            radius={10}
            pathOptions={{
              color: "#012642",
              fillColor: "#ffffff",
              fillOpacity: 1,
              weight: 4,
            }}
          >
            <Popup>{pickup.label || "Pickup"}</Popup>
            <Tooltip direction="top" offset={[0, -8]}>
              Pickup
            </Tooltip>
          </CircleMarker>
        )}
        {destinationCoordinates && (
          <CircleMarker
            center={destinationCoordinates}
            radius={11}
            pathOptions={{
              color: "#012642",
              fillColor: "#ffc83d",
              fillOpacity: 1,
              weight: 4,
            }}
          >
            <Popup>{destination.label || "Destination"}</Popup>
            <Tooltip direction="top" offset={[0, -8]}>
              Destination
            </Tooltip>
          </CircleMarker>
        )}
        {pickupCoordinates && destinationCoordinates && (
          <Polyline
            positions={[pickupCoordinates, destinationCoordinates]}
            pathOptions={{
              color: "#012642",
              weight: 5,
              opacity: 0.82,
              dashArray: international ? "10 9" : undefined,
            }}
          />
        )}
        {officeCoordinates.map(({ office, value }) => (
          <CircleMarker
            key={office.id}
            center={value}
            radius={7}
            pathOptions={{
              color: "#ffffff",
              fillColor: "#087f8c",
              fillOpacity: 1,
              weight: 3,
            }}
          >
            <Popup>
              <strong>{office.name}</strong>
              <br />
              {office.address}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      <div className="pointer-events-none absolute inset-x-3 top-3 z-[500] flex items-start justify-between gap-2">
        {allowMapSelection ? (
          <div className="pointer-events-auto flex rounded-xl border border-ink/10 bg-white p-1 shadow-lg">
            <button
              type="button"
              onClick={() => setTarget("pickup")}
              aria-pressed={target === "pickup"}
              className={`inline-flex h-10 items-center gap-2 rounded-lg px-3 text-xs font-bold ${target === "pickup" ? "bg-ink text-white" : "text-ink/65"}`}
            >
              <Crosshair className="size-4" /> Pickup
            </button>
            <button
              type="button"
              onClick={() => setTarget("destination")}
              aria-pressed={target === "destination"}
              className={`inline-flex h-10 items-center gap-2 rounded-lg px-3 text-xs font-bold ${target === "destination" ? "bg-cargo-yellow text-ink" : "text-ink/65"}`}
            >
              <MapPin className="size-4" /> Destination
            </button>
          </div>
        ) : (
          <span className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-ink shadow-lg">
            Select branches below
          </span>
        )}
        {allowMapSelection && (
          <button
            type="button"
            onClick={useCurrentLocation}
            disabled={locating}
            className="pointer-events-auto grid size-11 place-items-center rounded-xl border border-ink/10 bg-white text-ink shadow-lg disabled:opacity-50"
            aria-label="Use current location"
            title="Use current location"
          >
            <Navigation className="size-4" />
          </button>
        )}
      </div>

      {allowMapSelection && (
        <p className="pointer-events-none absolute inset-x-3 bottom-3 z-[500] rounded-xl bg-ink/90 px-3 py-2 text-center text-[11px] font-semibold text-white shadow-lg">
          Tap the map to set the{" "}
          {target === "pickup" ? "pickup" : "destination"} point
        </p>
      )}
    </section>
  );
}
