export type Twilight = 'civil' | 'nautical' | 'astronomical';

export interface Planet {
  name: string;
  altitude_deg: number;
  azimuth_deg: number;
}

export interface MoonInfo {
  altitude_deg: number;
  azimuth_deg: number;
  illumination_fraction: number;
}

export interface VisibleResponse {
  when_utc: string;
  location: {
    lat: number;
    lon: number;
    elevation_m: number;
  };
  twilight: Twilight;
  sun_altitude_deg: number;
  visible_planets: Planet[];
  moon: MoonInfo;
}

export interface FetchVisibleParams {
  lat: number;
  lon: number;
  elev?: number;
  twilight: Twilight;
  time?: string;
  signal?: AbortSignal;
}

const DEFAULT_BASE_URL = '/api';

function getBaseUrl(): string {
  const envValue = import.meta.env.VITE_API_BASE_URL?.trim();
  if (envValue && envValue.length > 0) {
    return envValue.replace(/\/?$/, '');
  }
  return DEFAULT_BASE_URL;
}

export async function fetchVisible({
  lat,
  lon,
  elev = 0,
  twilight,
  time,
  signal
}: FetchVisibleParams): Promise<VisibleResponse> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
    elev: elev.toString(),
    twilight
  });

  if (time && time.length > 0) {
    params.set('time', time);
  }

  const base = getBaseUrl();
  const url = `${base}/visible?${params.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    },
    signal
  });

  if (!response.ok) {
    const body = await response.text();
    const detail = body || response.statusText;
    throw new Error(`Visibility request failed (${response.status}): ${detail}`);
  }

  return (await response.json()) as VisibleResponse;
}
