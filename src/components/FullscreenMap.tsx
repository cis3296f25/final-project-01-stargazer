import { useCallback, useMemo, useRef } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import type { Coordinates } from "../lib/map";

interface FullscreenMapProps {
  coordinates: Coordinates;
  onCenterChange?: (coords: Coordinates) => void;
}

const TILE_URL_TEMPLATE =
  "http://localhost:5000/tiles/{z}/{x}/{y}.png";

// Your tiles are generated for zoom 0–7
const MIN_TILE_ZOOM = 0;
const MAX_TILE_ZOOM = 7;

export function FullscreenMap({ coordinates, onCenterChange }: FullscreenMapProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const lastNotifiedCenter = useRef<{ lat: number; lng: number } | null>(null);
  const overlayRef = useRef<google.maps.ImageMapType | null>(null);

  const center = useMemo(
    () => ({ lat: coordinates.lat, lng: coordinates.lon }),
    [coordinates.lat, coordinates.lon]
  );

  const { isLoaded, loadError } = useJsApiLoader({
    id: "stargazer-map",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "",
  });

  const handleOnLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      lastNotifiedCenter.current = center;

      // Create the overlay once, reuse it across map instances
      if (!overlayRef.current) {
        overlayRef.current = new google.maps.ImageMapType({
          name: "Light Pollution",
          tileSize: new google.maps.Size(256, 256),
          opacity: 0.6, // full for debugging; lower later if you want
          getTileUrl: (coord, zoom) => {
            if (zoom < MIN_TILE_ZOOM || zoom > MAX_TILE_ZOOM) {
              return "";
            }

            const max = 1 << zoom;
            const x = ((coord.x % max) + max) % max; // wrap X
            if (coord.y < 0 || coord.y >= max) return ""; // clamp Y

            const url = TILE_URL_TEMPLATE
              .replace("{z}", zoom.toString())
              .replace("{x}", x.toString())
              .replace("{y}", coord.y.toString());

            console.log("Tile request:", zoom, coord.x, coord.y, "->", url);
            return url;
          },
        });
      }

      // ⭐ ALWAYS attach the overlay to the current map
      map.overlayMapTypes.push(overlayRef.current);
    },
    [center]
  );

  const handleOnIdle = useCallback(() => {
    if (!mapRef.current || !onCenterChange) return;

    const mapCenter = mapRef.current.getCenter();
    if (!mapCenter) return;

    const next = { lat: mapCenter.lat(), lng: mapCenter.lng() };
    const prev = lastNotifiedCenter.current;

    if (
      !prev ||
      Math.abs(prev.lat - next.lat) > 0.0005 ||
      Math.abs(prev.lng - next.lng) > 0.0005
    ) {
      lastNotifiedCenter.current = next;
      onCenterChange({
        lat: next.lat,
        lon: next.lng,
        elev: coordinates.elev ?? 0,
      });
    }
  }, [onCenterChange, coordinates.elev]);

  const handleOnUnmount = useCallback(() => {
    if (mapRef.current && overlayRef.current) {
      const overlayArray = mapRef.current.overlayMapTypes.getArray();
      const idx = overlayArray.indexOf(overlayRef.current);

      if (idx !== -1) {
        mapRef.current.overlayMapTypes.removeAt(idx);
      }
    }

    mapRef.current = null;
  }, []);

  if (loadError) {
    return (
      <div className="flex h-full items-center justify-center rounded-3xl border border-danger/40 bg-danger/10 p-6 text-danger">
        Unable to load Google Maps: {loadError.message}
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-full items-center justify-center rounded-3xl border border-white/5 bg-surfaceAlt/60 text-textSecondary">
        Loading map…
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height: "100%", borderRadius: "32px" }}
      center={center}
      zoom={6}
      options={{
        disableDefaultUI: false,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        gestureHandling: "greedy",
      }}
      onLoad={handleOnLoad}
      onIdle={handleOnIdle}
      onUnmount={handleOnUnmount}
    >
      <Marker position={center} />
    </GoogleMap>
  );
}
