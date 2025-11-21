import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import type { Coordinates } from '../lib/map';
import { useCallback, useMemo, useRef, useState, useEffect } from 'react';

interface FullscreenMapProps {
  coordinates: Coordinates;
  onCenterChange?: (coords: Coordinates) => void;
}

export function FullscreenMap({ coordinates, onCenterChange }: FullscreenMapProps) {
  const mapRef = useRef<google.maps.Map | null>(null);

  const initialCenter = useRef({
      lat: coordinates.lat,
      lng: coordinates.lon
    });

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'stargazer-map',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? ''
  });

const [markerPos, setMarkerPos] = useState({
    lat: coordinates.lat,
    lng: coordinates.lon
  });

  useEffect(() => {
    setMarkerPos({ lat: coordinates.lat, lng: coordinates.lon });
  }, [coordinates.lat, coordinates.lon]);

  const handleOnLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
    },
    []
  );

const handleOnDoubleClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
        if(!onCenterChange || !e.latLng) return;

        const lat = e.latLng.lat();
        const lng = e.latLng.lng();

        setMarkerPos({ lat, lng });

        onCenterChange({
            lat,
            lon: lng,
            elev: coordinates.elev ?? 0
            });
        },
    [onCenterChange, coordinates.elev]
    );



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
      center={markerPos}
      zoom={6}
      options={{
        disableDefaultUI: true,
        mapTypeControl: false,

        gestureHandling: 'greedy',
        disableDoubleClickZoom: true,

      }}
      onLoad={handleOnLoad}
      onDblClick={handleOnDoubleClick}
    >
      <Marker position={markerPos} label="★" zIndex={9999} />

      {/* TEMP DEBUG OVERLAY */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'red',
            color: 'white',
            padding: '4px 8px',
            zIndex: 999999,
            fontSize: 12,
          }}
        >
          DEBUG
        </div>
    </GoogleMap>
  );
}
