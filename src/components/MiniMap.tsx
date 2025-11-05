import { type CSSProperties, useCallback, useMemo, useRef } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { Maximize2 } from 'lucide-react';
import type { Coordinates } from '../lib/map';

const containerStyle: CSSProperties = {
  width: '100%',
  aspectRatio: '16/9',
  borderRadius: '24px',
  overflow: 'hidden'
};

interface MiniMapProps {
  coordinates: Coordinates;
  onCenterChange?: (coords: Coordinates) => void;
  onEnterFullscreen: () => void;
}

export function MiniMap({ coordinates, onCenterChange, onEnterFullscreen }: MiniMapProps) {
  const center = useMemo(() => ({ lat: coordinates.lat, lng: coordinates.lon }), [coordinates.lat, coordinates.lon]);
  const mapRef = useRef<google.maps.Map | null>(null);
  const lastNotifiedCenter = useRef<{ lat: number; lng: number } | null>(null);

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
      <div className="glass-panel relative flex aspect-[16/9] items-center justify-center rounded-3xl p-6 text-sm text-danger">
        Unable to load Google Maps. {loadError.message}
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="glass-panel flex aspect-[16/9] items-center justify-center rounded-3xl text-sm text-textSecondary">
        Loading map…
      </div>
    );
  }

  if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="glass-panel flex aspect-[16/9] items-center justify-center rounded-3xl p-6 text-sm text-warning">
        Google Maps API key is not configured. Add VITE_GOOGLE_MAPS_API_KEY to your .env file.
      </div>
    );
  }

  return (
    <div className="relative">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={6}
        options={{
          disableDefaultUI: true,
          styles: [
            {
              featureType: 'all',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ],
          gestureHandling: 'greedy'
        }}
        onLoad={handleOnLoad}
        onIdle={handleOnIdle}
      >
        <Marker position={center} />
      </GoogleMap>
      <button
        type="button"
        className="absolute right-4 top-4 inline-flex items-center justify-center rounded-xl border border-white/20 bg-background/80 p-2 text-sm text-white shadow-lg transition hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        onClick={onEnterFullscreen}
        aria-label="Open fullscreen map"
      >
        <Maximize2 className="h-5 w-5" aria-hidden />
      </button>
    </div>
  );
}
