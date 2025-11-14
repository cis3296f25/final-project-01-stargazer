import type { ChangeEvent } from 'react';
import { CalendarClock, MapPin, RefreshCw } from 'lucide-react';
import { useHomeContext } from '../context/HomeContext';
import { formatCoordinate, formatTimestamp, isoToLocalInput, localInputToIso } from '../lib/format';
import { TwilightSelect } from './TwilightSelect';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  onRefresh?: () => void;
}

export function Navbar({ onRefresh }: NavbarProps) {
  const { coordinates, visibleData, twilight, setTwilight, timeIso, setTimeIso, loading, refetch } = useHomeContext();
    const navigate = useNavigate();

    const whenText = visibleData?.when_utc
    ? formatTimestamp(visibleData.when_utc)
    : timeIso
      ? formatTimestamp(timeIso)
      : 'Current time';

  const timeInputValue = timeIso ? isoToLocalInput(timeIso) : '';

  const handleTimeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (!value) {
      setTimeIso(undefined);
      return;
    }
    try {
      const iso = localInputToIso(value);
      setTimeIso(iso);
    } catch (error) {
      console.warn('Invalid time input', error);
    }
  };

  return (
    <header className="flex flex-col gap-4 border-b border-white/5 bg-background/60 px-6 py-4 backdrop-blur-xl md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-4">
        <div>
            <button
                type="button"
                onClick={() => navigate('/')}
                className="text-2xl font-semibold tracking-wide text-white hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
                StarGazer
            </button>
            <p className="mt-1 flex items-center gap-2 text-sm text-textSecondary">
            <MapPin className="h-4 w-4 text-accent" aria-hidden />
            <span>
              {formatCoordinate(coordinates.lat, 'lat')} · {formatCoordinate(coordinates.lon, 'lon')}
            </span>
          </p>
          <p className="text-xs text-textSecondary/80">{whenText}</p>
        </div>
      </div>
      <div className="flex flex-col items-stretch gap-4 md:flex-row md:items-center">
        <div className="flex flex-col text-xs uppercase tracking-wide text-textSecondary/70 md:w-80">
          <span className="mb-1 flex items-center gap-2 text-textSecondary">
            <CalendarClock className="h-4 w-4 text-accent" aria-hidden />
            Observation time
          </span>
          <div className="flex gap-2">
            <input
              type="datetime-local"
              value={timeInputValue}
              onChange={handleTimeChange}
              className="field-input flex-1"
            />
            <button
              type="button"
              className="rounded-lg border border-white/10 px-3 text-xs font-semibold text-textSecondary transition hover:border-accent hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              onClick={() => setTimeIso(undefined)}
            >
              Now
            </button>
          </div>
        </div>
        <div className="w-full md:w-[420px]">
          <TwilightSelect value={twilight} onChange={setTwilight} />
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-accent/40 px-4 py-2 text-sm font-medium text-accent transition hover:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          onClick={onRefresh ?? refetch}
          disabled={loading}
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
    </header>
  );
}
