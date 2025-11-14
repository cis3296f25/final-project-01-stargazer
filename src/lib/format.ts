import type { Planet, VisibleResponse } from './api';

export function formatCoordinate(value: number, type: 'lat' | 'lon'): string {
  const direction = type === 'lat' ? (value >= 0 ? 'N' : 'S') : value >= 0 ? 'E' : 'W';
  const absolute = Math.abs(value).toFixed(3);
  return `${absolute}° ${direction}`;
}

export function formatAltitude(altitude: number): string {
  return `${altitude >= 0 ? '+' : ''}${altitude.toFixed(1)}°`;
}

export function formatAzimuth(azimuth: number): string {
  return `${azimuth.toFixed(1)}°`;
}

export function formatIllumination(value: number): string {
  return `${Math.round(value * 100)}% illuminated`;
}

export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

export function isoToLocalInput(iso: string): string {
  const date = new Date(iso);
  const tzOffset = date.getTimezoneOffset() * 60000;
  const local = new Date(date.getTime() - tzOffset);
  return local.toISOString().slice(0, 16);
}

export function localInputToIso(value: string): string {
  const date = new Date(value);
  return date.toISOString();
}

export function summarizePlanets(planets: Planet[]): string {
  if (!planets.length) {
    return 'No visible planets right now';
  }
  const names = planets.map((planet) => planet.name).join(', ');
  return `Visible: ${names}`;
}

export function mapSummary(data: VisibleResponse | null): string {
  if (!data) {
    return 'Fetching latest visibility data…';
  }
  return `${formatTimestamp(data.when_utc)} • ${summarizePlanets(data.visible_planets)}`;
}
