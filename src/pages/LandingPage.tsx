import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LocationForm } from '../components/LocationForm';
import { useHomeContext } from '../context/HomeContext';
import { getBrowserGeolocation } from '../lib/geolocation';
import { isoToLocalInput } from '../lib/format';
import ShootingStars from '../components/ShootingStars';

export function LandingPage() {
	const navigate = useNavigate();
	const {
		coordinates,
		twilight,
		timeIso,
		setCoordinates,
		setTwilight,
		setTimeIso,
		setError,
		observedConstellations
	} = useHomeContext();
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = (values: {
		lat: number;
		lon: number;
		elev: number;
		twilight: typeof twilight;
		time?: string;
	}) => {
		setSubmitting(true);
		setCoordinates({ lat: values.lat, lon: values.lon, elev: values.elev });
		setTwilight(values.twilight);
		setTimeIso(values.time);
		setError(null);
		navigate('/home');
	};

	const handleUseGeolocation = async () => {
		const result = await getBrowserGeolocation();
		setCoordinates({
			lat: result.lat,
			lon: result.lon,
			elev: result.elev ?? coordinates.elev
		});
		return result;
	};

	return (
		<main className='flex min-h-screen flex-col items-center justify-center px-6 py-16'>
			<ShootingStars />
			<div className='grid w-full max-w-6xl gap-12 lg:grid-cols-[1.1fr_1fr]'>
				{/* Left side: Hero + feature copy + observed constellations */}
				<div className='flex flex-col justify-center gap-8 text-white'>
					<div className='flex flex-col gap-4'>
						<p className='text-sm uppercase tracking-[0.5rem] text-textSecondary/70'>Stargazer</p>
						<h1 className='text-4xl font-bold leading-tight sm:text-5xl'>
							Constellations &amp; Planets Above You
						</h1>
						<p className='text-lg text-textSecondary'>
							See which celestial bodies are visible from your location in real time. Enter your
							coordinates or use the automatic location option to start exploring the night sky.
						</p>
					</div>

					<ul className='grid gap-4 text-sm text-textSecondary'>
						<li className='glass-panel rounded-2xl border border-white/10 bg-surfaceAlt/60 p-4'>
							<p className='font-semibold text-textPrimary'>Real-time visibility</p>
							<p className='text-xs text-textSecondary/80'>
								Get an instant list of visible planets, the Moon&apos;s illumination, and sky conditions
								for your position.
							</p>
						</li>
						<li className='glass-panel rounded-2xl border border-white/10 bg-surfaceAlt/60 p-4'>
							<p className='font-semibold text-textPrimary'>Twilight controls</p>
							<p className='text-xs text-textSecondary/80'>
								Switch between civil, nautical, and astronomical twilight to match your observing
								conditions.
							</p>
						</li>
						<li className='glass-panel rounded-2xl border border-white/10 bg-surfaceAlt/60 p-4'>
							<p className='font-semibold text-textPrimary'>Map-based exploration</p>
							<p className='text-xs text-textSecondary/80'>
								Use the interactive map on the home view to fine-tune your observation coordinates.
							</p>
						</li>
					</ul>

					{/* Observed constellations summary */}
					<div className='glass-panel mt-2 rounded-3xl border border-white/10 bg-surfaceAlt/60 p-4'>
						<h3 className='text-sm font-semibold text-white'>Observed Constellations</h3>
						<p className='text-xs text-textSecondary'>
							Track which constellations you have already marked as observed on the sky view.
						</p>

						{observedConstellations.length === 0 ? (
							<p className='mt-3 text-xs text-textSecondary/80'>
								You have not marked any constellations as observed yet. Visit the home view and use the{' '}
								<span className='font-semibold'>“Mark observed”</span> button in the Constellations
								section.
							</p>
						) : (
							<ul className='mt-3 space-y-1 text-xs text-textSecondary/80'>
								{observedConstellations.slice(0, 5).map(id => (
									<li key={id} className='truncate'>
										• {id.toUpperCase()}
									</li>
								))}
								{observedConstellations.length > 5 && (
									<li className='text-[11px] text-textSecondary/70'>
										+ {observedConstellations.length - 5} more…
									</li>
								)}
							</ul>
						)}
					</div>
				</div>

				{/* Right side: Location form */}
				<div className='glass-panel relative z-10 rounded-3xl border border-white/10 bg-surface/90 p-6 shadow-xl backdrop-blur'>
					<h2 className='mb-2 text-lg font-semibold text-white'>Choose your sky</h2>
					<p className='mb-4 text-xs text-textSecondary'>
						Set your coordinates, twilight preference, and time to preview what is visible from your
						location.
					</p>
					<LocationForm
						initialValues={{
							lat: coordinates.lat.toFixed(4),
							lon: coordinates.lon.toFixed(4),
							elev: (coordinates.elev ?? 0).toFixed(0),
							twilight,
							time: timeIso ? isoToLocalInput(timeIso) : undefined
						}}
						onSubmit={handleSubmit}
						onUseGeolocation={handleUseGeolocation}
						submitting={submitting}
					/>
				</div>
			</div>
		</main>
	);
}
