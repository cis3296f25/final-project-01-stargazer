import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { debounce } from '../lib/debounce';
import { fetchVisible, type Twilight, type VisibleResponse } from '../lib/api';
import type { Coordinates } from '../lib/map';

interface HomeContextValue {
  coordinates: Coordinates;
  setCoordinates: (coords: Coordinates) => void;
  twilight: Twilight;
  setTwilight: (twilight: Twilight) => void;
  timeIso?: string;
  setTimeIso: (value?: string) => void;
  visibleData: VisibleResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  setError: (message: string | null) => void;
}

const DEFAULT_COORDINATES: Coordinates = {
  lat: 35.2271,
  lon: -80.8431,
  elev: 0
};

const COORDS_KEY = 'stargazer:coords';
const TWILIGHT_KEY = 'stargazer:twilight';
const TIME_KEY = 'stargazer:time';

const HomeContext = createContext<HomeContextValue | undefined>(undefined);

function loadStoredCoordinates(): Coordinates {
  if (typeof window === 'undefined') {
    return DEFAULT_COORDINATES;
  }
  try {
    const raw = localStorage.getItem(COORDS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Coordinates;
      if (typeof parsed.lat === 'number' && typeof parsed.lon === 'number') {
        return {
          lat: parsed.lat,
          lon: parsed.lon,
          elev: typeof parsed.elev === 'number' ? parsed.elev : 0
        };
      }
    }
  } catch (error) {
    console.warn('Failed to parse stored coordinates', error);
  }
  return DEFAULT_COORDINATES;
}

function loadStoredTwilight(): Twilight {
  if (typeof window === 'undefined') {
    return 'astronomical';
  }
  const raw = localStorage.getItem(TWILIGHT_KEY) as Twilight | null;
  if (raw === 'civil' || raw === 'nautical' || raw === 'astronomical') {
    return raw;
  }
  return 'astronomical';
}

function loadStoredTime(): string | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }
  const raw = localStorage.getItem(TIME_KEY);
  return raw ?? undefined;
}

export function HomeProvider({ children }: { children: ReactNode }) {
  const [coordinates, setCoordinatesState] = useState<Coordinates>(() => loadStoredCoordinates());
  const [twilight, setTwilightState] = useState<Twilight>(() => loadStoredTwilight());
  const [timeIso, setTimeIsoState] = useState<string | undefined>(() => loadStoredTime());
  const [visibleData, setVisibleData] = useState<VisibleResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    localStorage.setItem(COORDS_KEY, JSON.stringify(coordinates));
  }, [coordinates]);

  useEffect(() => {
    localStorage.setItem(TWILIGHT_KEY, twilight);
  }, [twilight]);

  useEffect(() => {
    if (timeIso) {
      localStorage.setItem(TIME_KEY, timeIso);
    } else {
      localStorage.removeItem(TIME_KEY);
    }
  }, [timeIso]);

  const executeFetch = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchVisible({
          lat: coordinates.lat,
          lon: coordinates.lon,
          elev: coordinates.elev ?? 0,
          twilight,
          time: timeIso,
          signal
        });
        setVisibleData(data);
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          return;
        }
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [coordinates, twilight, timeIso]
  );

  const debouncedFetch = useMemo(
    () =>
      debounce(() => {
        const controller = new AbortController();
        if (abortRef.current) {
          abortRef.current.abort();
        }
        abortRef.current = controller;
        void executeFetch(controller.signal);
      }, 320),
    [executeFetch]
  );

  useEffect(() => {
    debouncedFetch();
    return () => {
      debouncedFetch.cancel();
    };
  }, [coordinates, twilight, timeIso, debouncedFetch]);

  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  const setCoordinates = useCallback((coords: Coordinates) => {
    setCoordinatesState((previous) => {
      const next = {
        lat: coords.lat,
        lon: coords.lon,
        elev: coords.elev ?? 0
      };

      if (
        Math.abs(previous.lat - next.lat) < 0.0001 &&
        Math.abs(previous.lon - next.lon) < 0.0001 &&
        Math.abs((previous.elev ?? 0) - (next.elev ?? 0)) < 0.5
      ) {
        return previous;
      }

      return next;
    });
  }, []);

  const setTwilight = useCallback((value: Twilight) => {
    setTwilightState(value);
  }, []);

  const setTimeIso = useCallback((value?: string) => {
    setTimeIsoState(value && value.length > 0 ? value : undefined);
  }, []);

  const refetch = useCallback(() => {
    debouncedFetch.cancel();
    const controller = new AbortController();
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = controller;
    void executeFetch(controller.signal);
  }, [debouncedFetch, executeFetch]);

  const value: HomeContextValue = {
    coordinates,
    setCoordinates,
    twilight,
    setTwilight,
    timeIso,
    setTimeIso,
    visibleData,
    loading,
    error,
    refetch,
    setError
  };

  return <HomeContext.Provider value={value}>{children}</HomeContext.Provider>;
}

export function useHomeContext(): HomeContextValue {
  const context = useContext(HomeContext);
  if (!context) {
    throw new Error('useHomeContext must be used within a HomeProvider');
  }
  return context;
}

