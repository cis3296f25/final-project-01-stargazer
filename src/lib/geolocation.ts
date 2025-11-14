export interface GeolocationResult {
  lat: number;
  lon: number;
  elev?: number;
}

export function getBrowserGeolocation(): Promise<GeolocationResult> {
  if (!('geolocation' in navigator)) {
    return Promise.reject(new Error('Geolocation is not supported on this device.'));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          elev: position.coords.altitude ?? undefined
        });
      },
      (error) => {
        reject(new Error(error.message));
      },
      {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 60_000
      }
    );
  });
}
