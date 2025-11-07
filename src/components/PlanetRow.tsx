import { type Planet } from '../lib/api';
import { formatAltitude, formatAzimuth } from '../lib/format';

interface PlanetRowProps {
  planet: Planet;
}

export function PlanetRow({ planet }: PlanetRowProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-surfaceAlt/70 px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-white">{planet.name}</p>
        <p className="text-xs text-textSecondary/80">Altitude {formatAltitude(planet.altitude_deg)}</p>
      </div>
      <div className="text-right">
        <p className="text-xs uppercase tracking-wide text-textSecondary/70">Azimuth</p>
        <p className="text-sm font-medium text-textPrimary">{formatAzimuth(planet.azimuth_deg)}</p>
      </div>
    </div>
  );
}
