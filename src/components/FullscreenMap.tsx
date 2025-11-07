import { useCallback, useMemo, useRef } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import type { Coordinates } from '../lib/map';

interface FullscreenMapProps {
  coordinates: Coordinates;
  onCenterChange?: (coords: Coordinates) => void;
}

export function FullscreenMap({ coordinates, onCenterChange }: FullscreenMapProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const lastNotifiedCenter = useRef<{ lat: number; lng: number } | null>(null);
  const center = useMemo(() => ({ lat: coordinates.lat, lng: coordinates.lon }), [coordinates.lat, coordinates.lon]);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'stargazer-map',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? ''
  });

  const handleOnLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      lastNotifiedCenter.current = center;
    },
    [center]
  );

  const handleOnIdle = useCallback(() => {
    if (!mapRef.current || !onCenterChange) {
      return;
    }
    const mapCenter = mapRef.current.getCenter();
    if (!mapCenter) {
      return;
    }
    const next = { lat: mapCenter.lat(), lng: mapCenter.lng() };
    const prev = lastNotifiedCenter.current;
    if (!prev || Math.abs(prev.lat - next.lat) > 0.0005 || Math.abs(prev.lng - next.lng) > 0.0005) {
      lastNotifiedCenter.current = next;
      onCenterChange({ lat: next.lat, lon: next.lng, elev: coordinates.elev ?? 0 });
    }
  }, [coordinates.elev, onCenterChange]);

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
      mapContainerStyle={{ width: '100%', height: '100%', borderRadius: '32px' }}
      center={center}
      zoom={6}
      options={{
        disableDefaultUI: false,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        gestureHandling: 'greedy'
      }}
      onLoad={handleOnLoad}
      onIdle={handleOnIdle}
    >
      <Marker position={center} />
    </GoogleMap>
  );
}
