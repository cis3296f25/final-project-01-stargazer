import { AlertTriangle, Sun } from 'lucide-react';
import type { MoonInfo, Planet, Constellation } from '../lib/api';
import { formatAltitude } from '../lib/format';
import { PlanetRow } from './PlanetRow';
import { MoonCard } from './MoonCard';

interface VisibleListProps {
  planets: Planet[];
  moon?: MoonInfo;
  sunAltitudeDeg?: number;
  constellations?: Constellation[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function VisibleList({ planets, moon, sunAltitudeDeg, constellations, loading, error, onRetry }: VisibleListProps) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold text-white">Sky Highlights</h2>
        <p className="text-sm text-textSecondary">
          Real-time visibility for planets, the Moon, and constellations based on your selected twilight conditions.
        </p>
      </div>

      {sunAltitudeDeg !== undefined ? (
        <div className="glass-panel flex items-center gap-3 rounded-3xl p-4">
          <Sun className="h-10 w-10 text-warning" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-textPrimary">Sun Altitude</p>
            <p className="text-xs text-textSecondary">{formatAltitude(sunAltitudeDeg)}</p>
          </div>
        </div>
      ) : null}

      {moon ? <MoonCard moon={moon} /> : null}

      <div className="glass-panel flex flex-col gap-3 rounded-3xl p-6">
        <div className="flex items-baseline justify-between">
          <h3 className="text-lg font-semibold text-white">Visible Planets</h3>
          <span className="text-xs uppercase tracking-wide text-textSecondary/80">{planets.length} bodies</span>
        </div>
        {loading ? (
          <p className="text-sm text-textSecondary">Loading visibility data…</p>
        ) : error ? (
          <div className="flex flex-col gap-3 rounded-xl border border-danger/50 bg-danger/10 p-4 text-danger">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-4 w-4" aria-hidden />
              Unable to load data
            </div>
            <p className="text-sm text-danger/80">{error}</p>
            <button
              type="button"
              className="self-start rounded-lg border border-danger/60 px-3 py-1.5 text-xs font-semibold text-danger transition hover:border-danger"
              onClick={onRetry}
            >
              Retry
            </button>
          </div>
        ) : planets.length ? (
          <div className="flex flex-col gap-2">
            {planets.map((planet) => (
              <PlanetRow key={planet.name} planet={planet} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-textSecondary">No planets are currently above the horizon under these conditions.</p>
        )}
      </div>

      {constellations !== undefined ? (
        <div className="glass-panel flex flex-col gap-3 rounded-3xl p-6">
          <div className="flex items-baseline justify-between">
            <h3 className="text-lg font-semibold text-white">Constellations</h3>
            <span className="text-xs uppercase tracking-wide text-textSecondary/70">{constellations.length} entries</span>
          </div>
          {loading ? (
            <p className="text-sm text-textSecondary">Loading constellation data…</p>
          ) : error ? (
            <div className="flex flex-col gap-3 rounded-xl border border-danger/50 bg-danger/10 p-4 text-danger">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4" aria-hidden />
                Unable to load constellation data
              </div>
              <p className="text-sm text-danger/80">{error}</p>
            </div>
          ) : constellations.length > 0 ? (
            <ul className="grid gap-2 sm:grid-cols-2">
              {constellations.map((constellation) => (
                <li
                  key={constellation.id}
                  className="rounded-xl border border-white/5 bg-surfaceAlt/50 px-4 py-3 text-sm text-textSecondary"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-textPrimary">{constellation.name}</span>
                    <span className="text-xs uppercase tracking-wide text-textSecondary/60">
                      {constellation.abbreviation}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-textSecondary/80">
                    Alt {constellation.altitude_deg.toFixed(1)}° · Az {constellation.azimuth_deg.toFixed(0)}°
                    {` • Mag ${constellation.magnitude.toFixed(1)}`}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-textSecondary">No constellation data available.</p>
          )}
        </div>
      ) : null}
    </section>
  );
}
