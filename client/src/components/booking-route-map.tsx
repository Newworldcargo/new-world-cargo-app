import {
  Crosshair,
  LocateFixed,
  MapPin,
  Minus,
  Plus,
  Route,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

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
type GoogleMaps = typeof google;
type LatLng = google.maps.LatLngLiteral;

const lusaka: LatLng = { lat: -15.3875, lng: 28.3228 };
const googleMapsKey =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim() ||
  import.meta.env.VITE_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
  "";
let googleMapsPromise: Promise<GoogleMaps> | null = null;

function loadGoogleMaps() {
  if (window.google?.maps) return Promise.resolve(window.google);
  if (!googleMapsKey)
    return Promise.reject(new Error("Google Maps key missing"));
  if (googleMapsPromise) return googleMapsPromise;
  googleMapsPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-nwc-google-maps="true"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(window.google));
      existing.addEventListener("error", () =>
        reject(new Error("Google Maps failed to load"))
      );
      return;
    }
    const script = document.createElement("script");
    script.dataset.nwcGoogleMaps = "true";
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(googleMapsKey)}&v=weekly&libraries=marker,places,geometry`;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error("Google Maps failed to load"));
    document.head.appendChild(script);
  });
  return googleMapsPromise;
}

function pointToLatLng(point?: RouteMapPoint): LatLng | null {
  if (!Number.isFinite(point?.latitude) || !Number.isFinite(point?.longitude)) {
    return null;
  }
  return { lat: point!.latitude!, lng: point!.longitude! };
}

function fitBounds(
  map: google.maps.Map,
  points: LatLng[],
  international: boolean
) {
  if (points.length > 1) {
    const bounds = new google.maps.LatLngBounds();
    points.forEach(point => bounds.extend(point));
    map.fitBounds(bounds, 64);
    return;
  }
  if (points[0]) {
    map.panTo(points[0]);
    map.setZoom(international ? 5 : 13);
    return;
  }
  map.setCenter(international ? { lat: 2, lng: 35 } : lusaka);
  map.setZoom(international ? 3 : 6);
}

function markerIcon(kind: "pickup" | "destination" | "office" | "current") {
  const fill = {
    pickup: "#ffffff",
    destination: "#ffc83d",
    office: "#087f8c",
    current: "#012642",
  }[kind];
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: kind === "office" ? 8 : 10,
    fillColor: fill,
    fillOpacity: 1,
    strokeColor: kind === "pickup" ? "#012642" : "#ffffff",
    strokeWeight: kind === "office" ? 3 : 4,
  };
}

function clearOverlays(overlays: google.maps.MVCObject[]) {
  overlays.forEach(item => {
    if ("setMap" in item && typeof item.setMap === "function") {
      item.setMap(null);
    }
  });
}

async function googleLabel(googleMaps: GoogleMaps, point: LatLng) {
  try {
    const geocoder = new googleMaps.maps.Geocoder();
    const result = await geocoder.geocode({ location: point });
    return (
      result.results[0]?.formatted_address ||
      `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`
    );
  } catch {
    return `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`;
  }
}

export function BookingRouteMap({
  pickup,
  destination,
  offices = [],
  international = false,
  allowMapSelection = true,
  className = "",
  onPointSelect,
}: {
  pickup: RouteMapPoint;
  destination: RouteMapPoint;
  offices?: RouteMapOffice[];
  international?: boolean;
  allowMapSelection?: boolean;
  className?: string;
  onPointSelect: (target: RouteTarget, point: Required<RouteMapPoint>) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const overlaysRef = useRef<google.maps.MVCObject[]>([]);
  const routeTokenRef = useRef(0);
  const [maps, setMaps] = useState<GoogleMaps | null>(null);
  const [target, setTarget] = useState<RouteTarget>(
    pickup.label ? "destination" : "pickup"
  );
  const [status, setStatus] = useState<
    "loading" | "ready" | "missing" | "error"
  >("loading");
  const [locating, setLocating] = useState(false);
  const pickupCoordinates = pointToLatLng(pickup);
  const destinationCoordinates = pointToLatLng(destination);
  const officeCoordinates = useMemo(
    () =>
      offices.flatMap(office => {
        const value = pointToLatLng(office);
        return value ? [{ office, value }] : [];
      }),
    [offices]
  );

  useEffect(() => {
    let active = true;
    loadGoogleMaps()
      .then(value => {
        if (!active) return;
        setMaps(value);
        setStatus("ready");
      })
      .catch(error => {
        if (!active) return;
        setStatus(
          error instanceof Error && error.message.includes("key")
            ? "missing"
            : "error"
        );
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!maps || !containerRef.current || mapRef.current) return;
    mapRef.current = new maps.maps.Map(containerRef.current, {
      center: international ? { lat: 2, lng: 35 } : lusaka,
      zoom: international ? 3 : 6,
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
      zoomControl: false,
      clickableIcons: true,
      gestureHandling: "greedy",
      styles: [
        { featureType: "poi.business", stylers: [{ visibility: "off" }] },
        { featureType: "transit", stylers: [{ visibility: "off" }] },
      ],
    });
  }, [international, maps]);

  useEffect(() => {
    const map = mapRef.current;
    if (!maps || !map || !allowMapSelection) return;
    const listener = map.addListener(
      "click",
      (event: google.maps.MapMouseEvent) => {
        const latLng = event.latLng;
        if (!latLng) return;
        const point = { lat: latLng.lat(), lng: latLng.lng() };
        void googleLabel(maps, point).then(label => {
          onPointSelect(target, {
            label,
            latitude: point.lat,
            longitude: point.lng,
          });
          setTarget(target === "pickup" ? "destination" : "pickup");
        });
      }
    );
    return () => listener.remove();
  }, [allowMapSelection, maps, onPointSelect, target]);

  useEffect(() => {
    const map = mapRef.current;
    if (!maps || !map) return;
    clearOverlays(overlaysRef.current);
    overlaysRef.current = [];

    officeCoordinates.forEach(({ office, value }) => {
      overlaysRef.current.push(
        new maps.maps.Marker({
          map,
          position: value,
          title: `${office.name} - ${office.address}`,
          icon: markerIcon("office"),
        })
      );
    });
    if (pickupCoordinates) {
      overlaysRef.current.push(
        new maps.maps.Marker({
          map,
          position: pickupCoordinates,
          title: pickup.label || "Pickup",
          icon: markerIcon("pickup"),
          zIndex: 10,
        })
      );
    }
    if (destinationCoordinates) {
      overlaysRef.current.push(
        new maps.maps.Marker({
          map,
          position: destinationCoordinates,
          title: destination.label || "Destination",
          icon: markerIcon("destination"),
          zIndex: 11,
        })
      );
    }

    const routeToken = ++routeTokenRef.current;
    const visiblePoints = [
      pickupCoordinates,
      destinationCoordinates,
      ...officeCoordinates.map(item => item.value),
    ].filter((point): point is LatLng => Boolean(point));
    fitBounds(map, visiblePoints, international);

    if (pickupCoordinates && destinationCoordinates) {
      if (international) {
        overlaysRef.current.push(
          new maps.maps.Polyline({
            map,
            path: [pickupCoordinates, destinationCoordinates],
            geodesic: true,
            strokeColor: "#012642",
            strokeOpacity: 0.86,
            strokeWeight: 5,
          })
        );
        return;
      }
      const service = new maps.maps.DirectionsService();
      void service
        .route({
          origin: pickupCoordinates,
          destination: destinationCoordinates,
          travelMode: maps.maps.TravelMode.DRIVING,
        })
        .then(result => {
          if (routeToken !== routeTokenRef.current) return;
          const renderer = new maps.maps.DirectionsRenderer({
            map,
            directions: result,
            suppressMarkers: true,
            preserveViewport: true,
            polylineOptions: {
              strokeColor: "#012642",
              strokeOpacity: 0.86,
              strokeWeight: 5,
            },
          });
          overlaysRef.current.push(renderer);
        })
        .catch(() => {
          if (routeToken !== routeTokenRef.current) return;
          overlaysRef.current.push(
            new maps.maps.Polyline({
              map,
              path: [pickupCoordinates, destinationCoordinates],
              strokeColor: "#012642",
              strokeOpacity: 0.86,
              strokeWeight: 5,
            })
          );
        });
    }
  }, [
    destination.label,
    destinationCoordinates,
    international,
    maps,
    officeCoordinates,
    pickup.label,
    pickupCoordinates,
  ]);

  const useCurrentLocation = () => {
    if (!navigator.geolocation || !maps) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      position => {
        const point = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        const marker = new maps.maps.Marker({
          map: mapRef.current,
          position: point,
          title: "Your current location",
          icon: markerIcon("current"),
          zIndex: 12,
        });
        overlaysRef.current.push(marker);
        mapRef.current?.panTo(point);
        mapRef.current?.setZoom(14);
        void googleLabel(maps, point)
          .then(label =>
            onPointSelect("pickup", {
              label,
              latitude: point.lat,
              longitude: point.lng,
            })
          )
          .finally(() => setLocating(false));
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  };

  const zoomBy = (amount: number) => {
    const map = mapRef.current;
    if (!map) return;
    map.setZoom((map.getZoom() ?? (international ? 3 : 6)) + amount);
  };

  return (
    <section
      className={`relative min-h-[420px] overflow-hidden rounded-2xl border border-ink/10 bg-[#dfe8e9] ${className}`}
      aria-label="Booking route map"
    >
      <div ref={containerRef} className="absolute inset-0" />

      {status !== "ready" && (
        <div className="absolute inset-0 grid place-items-center bg-[#e8eef0] p-6 text-center">
          <div className="max-w-sm">
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-white text-ink shadow-sm">
              <Route className="size-5" />
            </div>
            <p className="mt-4 text-sm font-bold text-ink">
              {status === "missing"
                ? "Google Maps key is not configured"
                : status === "error"
                  ? "Google Maps could not load"
                  : "Loading Google Maps..."}
            </p>
            <p className="mt-2 text-xs leading-5 text-ink/55">
              The route details are still saved. Configure
              VITE_GOOGLE_MAPS_API_KEY for the live interactive map.
            </p>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex items-start justify-between gap-2">
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
        <div className="pointer-events-auto grid gap-2">
          {allowMapSelection && (
            <button
              type="button"
              onClick={useCurrentLocation}
              disabled={locating || status !== "ready"}
              className="grid size-11 place-items-center rounded-xl border border-ink/10 bg-white text-ink shadow-lg disabled:opacity-50"
              aria-label="Use current location"
              title="Use current location"
            >
              <LocateFixed className="size-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => zoomBy(1)}
            disabled={status !== "ready"}
            className="grid size-11 place-items-center rounded-xl border border-ink/10 bg-white text-ink shadow-lg disabled:opacity-50"
            aria-label="Zoom in"
            title="Zoom in"
          >
            <Plus className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => zoomBy(-1)}
            disabled={status !== "ready"}
            className="grid size-11 place-items-center rounded-xl border border-ink/10 bg-white text-ink shadow-lg disabled:opacity-50"
            aria-label="Zoom out"
            title="Zoom out"
          >
            <Minus className="size-4" />
          </button>
        </div>
      </div>

      {allowMapSelection && (
        <p className="pointer-events-none absolute inset-x-3 bottom-3 z-10 rounded-xl bg-ink/90 px-3 py-2 text-center text-[11px] font-semibold text-white shadow-lg">
          Click the map to set the{" "}
          {target === "pickup" ? "pickup" : "destination"} point
        </p>
      )}
    </section>
  );
}
