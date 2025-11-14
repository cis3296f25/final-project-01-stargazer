import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
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
  const initialCenter = useRef({
    lat: coordinates.lat,
    lng: coordinates.lon
  });

  const mapRef = useRef<google.maps.Map | null>(null);

  const [markerPos, setMarkerPos] = useState({
    lat: coordinates.lat,
    lng: coordinates.lon
  });

  useEffect(() => {
    setMarkerPos({ lat: coordinates.lat, lng: coordinates.lon });
  }, [coordinates.lat, coordinates.lon]);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'stargazer-map',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? ''
  });

  const handleOnLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const handleDblClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();

      setMarkerPos({ lat, lng });

      onCenterChange?.({
        lat,
        lon: lng,
        elev: coordinates.elev ?? 0
      });
    },
    [onCenterChange, coordinates.elev]
  );

  if (loadError) return <div>Error loading map: {loadError.message}</div>;
  if (!isLoaded) return <div>Loading map…</div>;

  return (
    <div className="relative">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={initialCenter.current} // ⬅️ THIS stays constant
        zoom={6}
        options={{
          disableDefaultUI: true,
          gestureHandling: 'greedy',
          disableDoubleClickZoom: true,
          styles: [
            {
              featureType: 'all',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        }}
        onLoad={handleOnLoad}
        onDblClick={handleDblClick}
      >
        <Marker position={markerPos} />
      </GoogleMap>

      <button
        type="button"
        className="absolute right-4 top-4 rounded-xl border border-white/20 bg-background/80 p-2 text-white shadow"
        onClick={onEnterFullscreen}
      >
        <Maximize2 className="h-5 w-5" />
      </button>
    </div>
  );
}
