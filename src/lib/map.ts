export interface Coordinates {
  lat: number;
  lon: number;
  elev?: number;
}

export function toLatLngLiteral(coords: Coordinates): google.maps.LatLngLiteral {
  return { lat: coords.lat, lng: coords.lon };
}

export function clampLatitude(lat: number): number {
  return Math.min(89.9999, Math.max(-89.9999, lat));
}

export function normalizeLongitude(lon: number): number {
  const normalized = ((lon + 180) % 360) - 180;
  return normalized < -180 ? normalized + 360 : normalized;
}
