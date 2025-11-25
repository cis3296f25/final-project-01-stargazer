import { useCallback, useRef, useState, useEffect } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import type { Coordinates } from "../lib/map";

interface FullscreenMapProps {
  coordinates: Coordinates;
  onCenterChange?: (coords: Coordinates) => void;
}

export function FullscreenMap({
  coordinates,
  onCenterChange,
}: FullscreenMapProps) {
  const mapRef = useRef<google.maps.Map | null>(null);

  // We use a ref for the initial center so the map doesn't re-center
  // every time the user drops a pin elsewhere.
  const initialCenter = useRef({
    lat: coordinates.lat,
    lng: coordinates.lon,
  });

  // This ensures the marker position is always in sync with props
  const markerPosition = {
    lat: coordinates.lat,
    lng: coordinates.lon,
  };

  const { isLoaded, loadError } = useJsApiLoader({
    id: "stargazer-map",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "",
  });

  const handleOnLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // --- 1. Handle Double Click ---
  const handleDblClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!e.latLng || !onCenterChange) return;

      const lat = e.latLng.lat();
      const lng = e.latLng.lng();

      // We ONLY update the coordinates (which moves the marker).
      // We do NOT call map.panTo(), so the map stays still.
      onCenterChange({
        lat,
        lon: lng,
        elev: coordinates.elev ?? 0,
      });
    },
    [onCenterChange, coordinates.elev]
  );

  // --- 2. Remove handleOnIdle ---
  // I have removed handleOnIdle.
  // Previously, this function updated the pin whenever you dragged the map.
  // By removing it, the pin stays put while the user looks around the map.

  // Optional: If the parent component changes coordinates (e.g. via a "Reset" button),
  // we might want to manually pan the map back to the pin.
  // If you don't want this 'auto-follow' behavior, you can remove this useEffect.
  useEffect(() => {
    if (mapRef.current) {
      // Only pan if the distance is very large (optional),
      // or strictly follow logic.
      // For now, I'm leaving this commented out so the map NEVER moves automatically,
      // which strictly mimics the MiniMap behavior.
      // mapRef.current.panTo({ lat: coordinates.lat, lng: coordinates.lon });
    }
  }, [coordinates.lat, coordinates.lon]);

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

  if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="flex h-full items-center justify-center rounded-3xl border border-warning/40 bg-warning/10 p-6 text-warning">
        Set VITE_GOOGLE_MAPS_API_KEY in your environment to enable the map.
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={{
        width: "100%",
        height: "100%",
        borderRadius: "32px",
      }}
      // Use initialCenter instead of center.
      // This allows the map to be uncontrolled (user can drag it anywhere without it snapping back)
      center={initialCenter.current}
      zoom={6}
      options={{
        disableDefaultUI: false,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        gestureHandling: "greedy",
        disableDoubleClickZoom: true, // Necessary to catch the double click event
      }}
      onLoad={handleOnLoad}
      onDblClick={handleDblClick}
    >
      {/* The Marker follows the state, appearing wherever you double clicked */}
      <Marker position={markerPosition} />
    </GoogleMap>
  );
}
