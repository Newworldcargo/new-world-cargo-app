import {
  Crosshair,
  LocateFixed,
  MapPin,
  Minus,
  Plus,
  Route,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { GOOGLE_MAPS_API_KEY } from "@/config/api-keys";

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
type MapService = "local" | "intercity" | "import" | "custom";

const lusaka: LatLng = { lat: -15.3875, lng: 28.3228 };
const worldOverview = { lat: 2, lng: 35 };
const googleMapsKey = GOOGLE_MAPS_API_KEY.trim();
let googleMapsPromise: Promise<GoogleMaps> | null = null;

const brandMapStyle: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#F5F3EA" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#38505C" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#FFFFFF" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#D4E5EA" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#E8EDDF" }] },
  { featureType: "landscape.man_made", elementType: "geometry", stylers: [{ color: "#F1EFE5" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#E9EBDD" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#FFFFFF" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#F5DEA0" }] },
  { featureType: "poi", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];

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
    script.onerror = () => {
      script.remove();
      googleMapsPromise = null;
      reject(new Error("Google Maps failed to load"));
    };
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
  international: boolean,
  zoomedOut = false
) {
  if (points.length > 1) {
    const bounds = new google.maps.LatLngBounds();
    points.forEach(point => bounds.extend(point));
    map.fitBounds(bounds, international ? 92 : 64);
    return;
  }
  if (points[0]) {
    map.panTo(points[0]);
    map.setZoom(international ? (zoomedOut ? 3 : 5) : 13);
    return;
  }
  map.setCenter(international ? worldOverview : lusaka);
  map.setZoom(international ? 2 : 6);
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

const radians = (degrees: number) => (degrees * Math.PI) / 180;

function internationalRoutePoints(origin: LatLng, destination: LatLng): LatLng[] {
  const vector = (point: LatLng) => {
    const lat = radians(point.lat);
    const lng = radians(point.lng);
    return [
      Math.cos(lat) * Math.cos(lng),
      Math.cos(lat) * Math.sin(lng),
      Math.sin(lat),
    ];
  };
  const a = vector(origin);
  const b = vector(destination);
  const angle = Math.acos(
    Math.max(-1, Math.min(1, a.reduce((sum, value, index) => sum + value * b[index], 0)))
  );
  if (Math.abs(Math.sin(angle)) < 0.000001) return [origin, destination];
  return Array.from({ length: 65 }, (_, index) => {
    const t = index / 64;
    const first = Math.sin((1 - t) * angle) / Math.sin(angle);
    const second = Math.sin(t * angle) / Math.sin(angle);
    const [x, y, z] = a.map((value, vectorIndex) => first * value + second * b[vectorIndex]);
    return {
      lat: (Math.atan2(z, Math.hypot(x, y)) * 180) / Math.PI,
      lng: (Math.atan2(y, x) * 180) / Math.PI,
    };
  });
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
  service = "local",
  international = false,
  allowMapSelection = true,
  centerPinSelection = false,
  activeTarget,
  onActiveTargetChange,
  className = "",
  onPointSelect,
}: {
  pickup: RouteMapPoint;
  destination: RouteMapPoint;
  offices?: RouteMapOffice[];
  service?: MapService;
  international?: boolean;
  allowMapSelection?: boolean;
  centerPinSelection?: boolean;
  activeTarget?: RouteTarget;
  onActiveTargetChange?: (target: RouteTarget) => void;
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
  const [locationError, setLocationError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [routeState, setRouteState] = useState<"idle" | "loading" | "ready" | "fallback">("idle");
  const [moving, setMoving] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [pendingPoint, setPendingPoint] =
    useState<Required<RouteMapPoint> | null>(null);
  const [confirmState, setConfirmState] = useState<"idle" | "done">("idle");
  const [confirmedTarget, setConfirmedTarget] = useState<RouteTarget>("pickup");
  const pickupCoordinates = useMemo(() => pointToLatLng(pickup), [pickup.latitude, pickup.longitude]);
  const destinationCoordinates = useMemo(() => pointToLatLng(destination), [destination.latitude, destination.longitude]);
  const currentTarget = activeTarget ?? target;
  const setCurrentTarget = (next: RouteTarget) => {
    setTarget(next);
    onActiveTargetChange?.(next);
  };
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
  }, [loadAttempt]);

  useEffect(() => {
    if (!maps || !containerRef.current || mapRef.current) return;
    mapRef.current = new maps.maps.Map(containerRef.current, {
      center: international ? worldOverview : lusaka,
      zoom: international ? 2 : 6,
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
      zoomControl: false,
      clickableIcons: true,
      gestureHandling: "greedy",
      styles: brandMapStyle,
    });
  }, [international, maps]);

  useEffect(() => {
    const map = mapRef.current;
    if (!maps || !map || !allowMapSelection || centerPinSelection) return;
    const listener = map.addListener(
      "click",
      (event: google.maps.MapMouseEvent) => {
        const latLng = event.latLng;
        if (!latLng) return;
        const point = { lat: latLng.lat(), lng: latLng.lng() };
        void googleLabel(maps, point).then(label => {
          onPointSelect(currentTarget, {
            label,
            latitude: point.lat,
            longitude: point.lng,
          });
          setCurrentTarget(currentTarget === "pickup" ? "destination" : "pickup");
        });
      }
    );
    return () => listener.remove();
  }, [allowMapSelection, centerPinSelection, maps, onPointSelect, currentTarget]);

  useEffect(() => {
    const map = mapRef.current;
    if (!maps || !map || !allowMapSelection || !centerPinSelection) return;
    let timer: number | undefined;
    const dragStart = map.addListener("dragstart", () => {
      setMoving(true);
      setConfirmState("idle");
    });
    const zoomChanged = map.addListener("zoom_changed", () => {
      setMoving(true);
      setConfirmState("idle");
    });
    const idle = map.addListener("idle", () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const center = map.getCenter();
        if (!center) return;
        const point = { lat: center.lat(), lng: center.lng() };
        setMoving(false);
        setResolving(true);
        void googleLabel(maps, point)
          .then(label =>
            setPendingPoint({
              label,
              latitude: point.lat,
              longitude: point.lng,
            })
          )
          .finally(() => setResolving(false));
      }, 450);
    });
    return () => {
      window.clearTimeout(timer);
      dragStart.remove();
      zoomChanged.remove();
      idle.remove();
    };
  }, [allowMapSelection, centerPinSelection, maps]);

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
    const selectedPoints = [pickupCoordinates, destinationCoordinates]
      .filter((point): point is LatLng => Boolean(point));
    const visiblePoints = selectedPoints.length ? selectedPoints : officeCoordinates.map(item => item.value);
    fitBounds(map, visiblePoints, international, service === "import");

    if (pickupCoordinates && destinationCoordinates) {
      if (international) {
        const path = internationalRoutePoints(pickupCoordinates, destinationCoordinates);
        overlaysRef.current.push(
          new maps.maps.Polyline({
            map,
            path,
            geodesic: true,
            strokeColor: "#012642",
            strokeOpacity: 0,
            strokeWeight: 0,
            icons: [
              {
                icon: {
                  path: "M 0,-1 0,1",
                  strokeOpacity: 0.9,
                  strokeColor: "#012642",
                  scale: 4,
                },
                offset: "0",
                repeat: "18px",
              },
            ],
          })
        );
        setRouteState("ready");
        return;
      }
      setRouteState("loading");
      const directionsService = new maps.maps.DirectionsService();
      void directionsService
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
          setRouteState("ready");
        })
        .catch(() => {
          if (routeToken !== routeTokenRef.current) return;
          setRouteState("fallback");
        });
      return;
    }
    setRouteState("idle");
  }, [
    destination.label,
    destinationCoordinates,
    international,
    maps,
    officeCoordinates,
    pickup.label,
    pickupCoordinates,
    service,
  ]);

  const confirmPendingPoint = () => {
    if (!pendingPoint) return;
    const confirmed = currentTarget;
    onPointSelect(currentTarget, pendingPoint);
    setConfirmedTarget(confirmed);
    setConfirmState("done");
    if (confirmed === "pickup") setCurrentTarget("destination");
    window.setTimeout(() => setConfirmState("idle"), 1600);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation || !maps) return;
    setLocating(true);
    setLocationError("");
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
            onPointSelect(currentTarget, {
              label,
              latitude: point.lat,
              longitude: point.lng,
            })
          )
          .finally(() => setLocating(false));
      },
      () => {
        setLocating(false);
        setLocationError("Your location is unavailable. Search for a place or allow location access and try again.");
      },
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
      {locationError && <p role="alert" className="absolute inset-x-3 top-16 z-30 rounded-lg bg-white p-3 text-sm text-red-700">{locationError}</p>}

      {status !== "ready" && (
        <div className="absolute inset-0 grid place-items-center bg-[#e8eef0] p-6 text-center">
          <div className="max-w-sm">
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-white text-ink shadow-sm">
              <Route className="size-5" />
            </div>
            <p className="mt-4 text-sm font-bold text-ink">
              {status === "missing"
                ? "Interactive map is temporarily unavailable"
                : status === "error"
                  ? "Interactive map could not load"
                  : "Loading map..."}
            </p>
            <p className="mt-2 text-xs leading-5 text-ink/55">
              Your route details are still saved. You can continue using the
              location fields and try the map again shortly.
            </p>
            {status !== "loading" && <button type="button" onClick={() => {
              setStatus("loading");
              setLoadAttempt(value => value + 1);
            }} className="mt-3 rounded-lg border border-ink/20 bg-white px-4 py-3 text-sm font-bold">Retry map</button>}
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex items-start justify-between gap-2">
        {allowMapSelection ? (
          <div className="pointer-events-auto flex rounded-xl border border-ink/10 bg-white p-1 shadow-lg">
            <button
              type="button"
              onClick={() => setCurrentTarget("pickup")}
              aria-pressed={currentTarget === "pickup"}
              className={`inline-flex h-10 items-center gap-2 rounded-lg px-3 text-xs font-bold ${currentTarget === "pickup" ? "bg-cargo-yellow text-ink" : "text-ink/65"}`}
            >
              <Crosshair className="size-4" /> From
            </button>
            <button
              type="button"
              onClick={() => setCurrentTarget("destination")}
              aria-pressed={currentTarget === "destination"}
              className={`inline-flex h-10 items-center gap-2 rounded-lg px-3 text-xs font-bold ${currentTarget === "destination" ? "bg-cargo-yellow text-ink" : "text-ink/65"}`}
            >
              <MapPin className="size-4" /> To
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

      {allowMapSelection && status === "ready" && (
        <>
          {centerPinSelection && (
            <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
              <div className="translate-y-[-18px]">
                <MapPin
                  className={`size-11 drop-shadow-lg ${currentTarget === "pickup" ? "fill-white text-ink" : "fill-cargo-yellow text-ink"}`}
                />
              </div>
            </div>
          )}
          <div className="absolute inset-x-3 bottom-3 z-20 rounded-lg border border-ink/10 bg-white p-3 text-ink shadow-lg">
            <p className="text-center text-[11px] font-semibold">
              {centerPinSelection
                ? moving
                  ? `Move the map to position ${currentTarget === "pickup" ? "From" : "To"}`
                  : resolving
                    ? "Finding the location under the pin..."
                    : confirmState === "done"
                      ? `${confirmedTarget === "pickup" ? "From" : "To"} location confirmed`
                      : pendingPoint?.label ||
                        `Move the map under the fixed pin, then confirm ${currentTarget === "pickup" ? "From" : "To"}`
                : `Click the map to set the ${currentTarget === "pickup" ? "From" : "To"} point`}
            </p>
            {routeState === "loading" && (
              <p className="mt-1 text-center text-[10px] font-semibold text-white/75">
                Updating route preview...
              </p>
            )}
            {routeState === "fallback" && (
              <p className="mt-1 text-center text-[10px] font-semibold text-white/75">
                Road route is unavailable. From and To pins are shown.
              </p>
            )}
            {international && pickupCoordinates && destinationCoordinates && (
              <p className="mt-1 text-center text-[10px] font-semibold text-white/75">
                Dotted international lane shown. Zoom in for street-level map
                detail.
              </p>
            )}
            {centerPinSelection && (
              <button
                type="button"
                onClick={confirmPendingPoint}
                disabled={!pendingPoint || resolving || moving}
                className="mt-2 h-10 w-full rounded-lg bg-cargo-yellow text-xs font-extrabold text-ink disabled:cursor-not-allowed disabled:opacity-50"
              >
                Confirm {currentTarget === "pickup" ? "From" : "To"} location
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
