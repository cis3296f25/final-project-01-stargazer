import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
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

	observedConstellations: string[];
	markConstellationObserved: (id: string) => void;
	unmarkConstellationObserved: (id: string) => void;
	isConstellationObserved: (id: string) => boolean;
}

const DEFAULT_COORDINATES: Coordinates = {
	lat: 35.2271,
	lon: -80.8431,
	elev: 0
};

const COORDS_KEY = 'stargazer:coords';
const TWILIGHT_KEY = 'stargazer:twilight';
const TIME_KEY = 'stargazer:time';
const OBSERVED_CONSTELLATIONS_KEY = 'stargazer:observed-constellations';

const HomeContext = createContext<HomeContextValue | undefined>(undefined);

function loadStoredCoordinates(): Coordinates {
	if (typeof window === 'undefined') {
		return DEFAULT_COORDINATES;
	}
	try {
		const raw = localStorage.getItem(COORDS_KEY);
		if (!raw) return DEFAULT_COORDINATES;

		const parsed = JSON.parse(raw) as Partial<Coordinates>;
		if (typeof parsed.lat === 'number' && typeof parsed.lon === 'number') {
			return {
				lat: parsed.lat,
				lon: parsed.lon,
				elev: typeof parsed.elev === 'number' ? parsed.elev : 0
			};
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
	const raw = localStorage.getItem(TWILIGHT_KEY);
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

function loadStoredObservedConstellations(): string[] {
	if (typeof window === 'undefined') {
		return [];
	}
	try {
		const raw = localStorage.getItem(OBSERVED_CONSTELLATIONS_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed.filter((x: unknown): x is string => typeof x === 'string');
	} catch {
		return [];
	}
}

export function HomeProvider({ children }: { children: ReactNode }) {
	const [coordinates, setCoordinatesState] = useState<Coordinates>(() => loadStoredCoordinates());
	const [twilight, setTwilightState] = useState<Twilight>(() => loadStoredTwilight());
	const [timeIso, setTimeIsoState] = useState<string | undefined>(() => loadStoredTime());
	const [visibleData, setVisibleData] = useState<VisibleResponse | null>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [fetchTick, setFetchTick] = useState(0);
	const abortRef = useRef<AbortController | null>(null);

	const [observedConstellations, setObservedConstellations] = useState<string[]>(() =>
		loadStoredObservedConstellations()
	);

	// Persist coordinates, twilight, time, observed constellations
	useEffect(() => {
		try {
			localStorage.setItem(COORDS_KEY, JSON.stringify(coordinates));
		} catch {
			// ignore
		}
	}, [coordinates]);

	useEffect(() => {
		try {
			localStorage.setItem(TWILIGHT_KEY, twilight);
		} catch {
			// ignore
		}
	}, [twilight]);

	useEffect(() => {
		try {
			if (timeIso) {
				localStorage.setItem(TIME_KEY, timeIso);
			} else {
				localStorage.removeItem(TIME_KEY);
			}
		} catch {
			// ignore
		}
	}, [timeIso]);

	useEffect(() => {
		try {
			localStorage.setItem(OBSERVED_CONSTELLATIONS_KEY, JSON.stringify(observedConstellations));
		} catch {
			// ignore
		}
	}, [observedConstellations]);

	// Fetch visibility data whenever inputs or refetch tick change
	useEffect(() => {
		const controller = new AbortController();

		if (abortRef.current) {
			abortRef.current.abort();
		}
		abortRef.current = controller;

		setLoading(true);
		setError(null);

		const run = async () => {
			try {
				const data = await fetchVisible({
					lat: coordinates.lat,
					lon: coordinates.lon,
					elev: coordinates.elev ?? 0,
					twilight,
					time: timeIso,
					signal: controller.signal
				});
				setVisibleData(data);
			} catch (err) {
				if ((err as any)?.name === 'AbortError') {
					return;
				}
				console.error('Failed to fetch visible data', err);
				setError((err as Error).message || 'Failed to load visibility data');
			} finally {
				setLoading(false);
			}
		};

		void run();

		return () => {
			controller.abort();
		};
	}, [coordinates.lat, coordinates.lon, coordinates.elev, twilight, timeIso, fetchTick]);

	const setCoordinates = useCallback((next: Coordinates) => {
		setCoordinatesState(next);
		setFetchTick(t => t + 1);
	}, []);

	const setTwilight = useCallback((value: Twilight) => {
		setTwilightState(value);
		setFetchTick(t => t + 1);
	}, []);

	const setTimeIso = useCallback((value?: string) => {
		setTimeIsoState(value && value.length > 0 ? value : undefined);
		setFetchTick(t => t + 1);
	}, []);

	const refetch = useCallback(() => {
		setFetchTick(t => t + 1);
	}, []);

	const markConstellationObserved = useCallback((id: string) => {
		setObservedConstellations(prev => {
			if (prev.includes(id)) return prev;
			return [...prev, id];
		});
	}, []);

	const unmarkConstellationObserved = useCallback((id: string) => {
		setObservedConstellations(prev => prev.filter(x => x !== id));
	}, []);

	const isConstellationObserved = useCallback(
		(id: string) => observedConstellations.includes(id),
		[observedConstellations]
	);

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
		setError,

		observedConstellations,
		markConstellationObserved,
		unmarkConstellationObserved,
		isConstellationObserved
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
