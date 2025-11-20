import { AlertTriangle, Sun, Sparkles } from 'lucide-react';
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

type QualityLabel = 'Poor' | 'Fair' | 'Good' | 'Excellent';

function computeObservationQuality(
	sunAltitudeDeg?: number,
	moon?: MoonInfo,
	planetCount: number = 0
): { label: QualityLabel; score: number; description: string } {
	let score = 0;

	// 0–1: darkness score based on sun altitude
	if (typeof sunAltitudeDeg === 'number') {
		if (sunAltitudeDeg > -6) {
			// still pretty bright
			score += 0.1;
		} else if (sunAltitudeDeg > -12) {
			// nautical
			score += 0.4;
		} else if (sunAltitudeDeg > -18) {
			// astronomical twilight
			score += 0.7;
		} else {
			// fully dark sky
			score += 1.0;
		}
	}

	// 0–0.5: moon score (new moon is best)
	if (moon) {
		const moonScore = 1 - Math.min(Math.max(moon.illumination_fraction, 0), 1); // 1 = dark, 0 = bright
		score += 0.5 * moonScore;
	}

	// 0–0.5: visible planets (cap at 4)
	const planetScore = Math.min(planetCount, 4) / 4;
	score += 0.5 * planetScore;

	// Normalize to 0–100 for fun
	const normalized = Math.max(0, Math.min(score / 2.0, 1));
	const percentage = Math.round(normalized * 100);

	let label: QualityLabel;
	if (normalized >= 0.8) {
		label = 'Excellent';
	} else if (normalized >= 0.55) {
		label = 'Good';
	} else if (normalized >= 0.3) {
		label = 'Fair';
	} else {
		label = 'Poor';
	}

	let description: string;
	if (label === 'Excellent') {
		description = 'Dark sky, low moonlight, and multiple targets visible.';
	} else if (label === 'Good') {
		description = 'Generally good conditions with decent darkness and some bright targets.';
	} else if (label === 'Fair') {
		description = 'Mixed conditions – you may still see a few objects, but contrast is limited.';
	} else {
		description = 'Bright sky or strong moonlight is washing out most of the night sky.';
	}

	return { label, score: percentage, description };
}

export function VisibleList({
	planets,
	moon,
	sunAltitudeDeg,
	constellations,
	loading,
	error,
	onRetry
}: VisibleListProps) {
	const hasVisibilityData = typeof sunAltitudeDeg === 'number' || moon !== undefined || planets.length > 0;

	const quality = hasVisibilityData ? computeObservationQuality(sunAltitudeDeg, moon, planets.length) : null;

	return (
		<section className='flex flex-col gap-6'>
			<div className='flex flex-col gap-2'>
				<h2 className='text-2xl font-semibold text-white'>Sky Highlights</h2>
				<p className='text-sm text-textSecondary'>
					Real-time visibility for planets, the Moon, and constellations based on your selected twilight
					conditions.
				</p>
			</div>

			{sunAltitudeDeg !== undefined ? (
				<div className='glass-panel flex items-center gap-3 rounded-3xl p-4'>
					<Sun className='h-10 w-10 text-warning' aria-hidden />
					<div>
						<p className='text-sm font-semibold text-textPrimary'>Sun Altitude</p>
						<p className='text-xs text-textSecondary'>{formatAltitude(sunAltitudeDeg)}</p>
					</div>
				</div>
			) : null}

			{moon ? <MoonCard moon={moon} /> : null}

			{quality ? (
				<div className='glass-panel flex items-center gap-3 rounded-3xl p-4'>
					<Sparkles className='h-8 w-8 text-accent' aria-hidden />
					<div>
						<p className='text-sm font-semibold text-textPrimary'>
							Tonight&apos;s viewing conditions: {quality.label}
						</p>
						<p className='text-xs text-textSecondary'>
							Score {quality.score}/100 · {quality.description}
						</p>
					</div>
				</div>
			) : null}

			<div className='glass-panel flex flex-col gap-3 rounded-3xl p-6'>
				<div className='flex items-baseline justify-between'>
					<h3 className='text-lg font-semibold text-white'>Visible Planets</h3>
					<span className='text-xs uppercase tracking-wide text-textSecondary/80'>
						{planets.length} bodies
					</span>
				</div>
				{loading ? (
					<p className='text-sm text-textSecondary'>Loading visibility data…</p>
				) : error ? (
					<div className='flex flex-col gap-3 rounded-xl border border-danger/50 bg-danger/10 p-4 text-danger'>
						<div className='flex items-center gap-2 font-semibold'>
							<AlertTriangle className='h-4 w-4' aria-hidden />
							Unable to load data
						</div>
						<p className='text-sm text-danger/80'>{error}</p>
						<button
							type='button'
							className='self-start rounded-lg border border-danger/60 px-3 py-1.5 text-xs font-semibold text-danger transition hover:border-danger'
							onClick={onRetry}
						>
							Retry
						</button>
					</div>
				) : planets.length ? (
					<div className='flex flex-col gap-2'>
						{planets.map(planet => (
							<PlanetRow key={planet.name} planet={planet} />
						))}
					</div>
				) : (
					<p className='text-sm text-textSecondary'>
						No planets are currently above the horizon under these conditions.
					</p>
				)}
			</div>

			{constellations !== undefined ? (
				<div className='glass-panel flex flex-col gap-3 rounded-3xl p-6'>
					<div className='flex items-baseline justify-between'>
						<h3 className='text-lg font-semibold text-white'>Constellations</h3>
						<span className='text-xs uppercase tracking-wide text-textSecondary/70'>
							{constellations.length} entries
						</span>
					</div>
					{loading ? (
						<p className='text-sm text-textSecondary'>Loading constellations…</p>
					) : constellations.length ? (
						<div className='grid grid-cols-1 gap-2 text-sm text-textSecondary sm:grid-cols-2'>
							{constellations.map(c => (
								<div key={c.id} className='rounded-xl border border-white/5 bg-surfaceAlt/60 px-4 py-3'>
									<p className='text-sm font-semibold text-white'>{c.name}</p>
									<p className='text-xs text-textSecondary/80'>
										{c.abbreviation.toUpperCase()} • Alt {formatAltitude(c.altitude_deg)}
									</p>
								</div>
							))}
						</div>
					) : (
						<p className='text-sm text-textSecondary'>
							No constellations are currently above the horizon under these conditions.
						</p>
					)}
				</div>
			) : null}
		</section>
	);
}
