import { X, MapPin } from 'lucide-react';
import type { VisibleResponse } from '../lib/api';
import { formatCoordinate, formatTimestamp, summarizePlanets } from '../lib/format';
import type { Coordinates } from '../lib/map';

interface InfoPanelProps {
  coordinates: Coordinates;
  data: VisibleResponse | null;
  onExit: () => void;
}

export function InfoPanel({ coordinates, data, onExit }: InfoPanelProps) {
  return (
    <aside className="glass-panel flex w-full flex-col gap-6 rounded-3xl p-6 lg:w-96">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Observation Summary</h2>
          <p className="text-sm text-textSecondary">Adjust the map to update your sky view.</p>
        </div>
        <button
          type="button"
          className="rounded-full border border-white/10 p-2 text-textSecondary transition hover:border-accent hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          onClick={onExit}
          aria-label="Exit fullscreen"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-surfaceAlt/70 p-4">
        <MapPin className="h-10 w-10 text-accent" aria-hidden />
        <div className="text-sm text-textSecondary">
          <p className="text-base font-semibold text-white">Current Center</p>
          <p>{formatCoordinate(coordinates.lat, 'lat')}</p>
          <p>{formatCoordinate(coordinates.lon, 'lon')}</p>
          {typeof coordinates.elev === 'number' ? (
            <p>{Math.round(coordinates.elev)} m elevation</p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-surfaceAlt/50 p-4">
        <p className="text-xs uppercase tracking-wide text-textSecondary/70">Last updated</p>
        <p className="text-sm font-medium text-textPrimary">
          {data?.when_utc ? formatTimestamp(data.when_utc) : 'Fetching latest data…'}
        </p>
        <p className="text-sm text-textSecondary">
          {data ? summarizePlanets(data.visible_planets) : 'Planets will appear after data loads.'}
        </p>
      </div>
    </aside>
  );
}
