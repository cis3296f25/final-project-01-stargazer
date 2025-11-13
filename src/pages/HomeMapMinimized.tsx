import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { VisibleList } from '../components/VisibleList';
import { MiniMap } from '../components/MiniMap';
import { Footer } from '../components/Footer';
import { useHomeContext } from '../context/HomeContext';
import type { Coordinates } from '../lib/map';

export function HomeMapMinimized() {
	const navigate = useNavigate();
	const {
		coordinates,
		setCoordinates,
		visibleData,
		loading,
		error,
		refetch,
		twilight,
		timeIso,
		favorites,
		addFavorite,
		removeFavorite,
		loadFavorite
	} = useHomeContext();

	const handleCenterChange = (next: Coordinates) => {
		setCoordinates(next);
	};

	const handleSaveCurrentView = () => {
		if (!coordinates || Number.isNaN(coordinates.lat) || Number.isNaN(coordinates.lon)) {
			return;
		}

		const labelParts: string[] = [];
		labelParts.push(`Lat ${coordinates.lat.toFixed(2)}, Lon ${coordinates.lon.toFixed(2)}`);
		if (timeIso) {
			labelParts.push(new Date(timeIso).toLocaleString());
		}
		labelParts.push(`${twilight} twilight`);

		addFavorite({
			name: labelParts.join(' • '),
			lat: coordinates.lat,
			lon: coordinates.lon,
			elev: coordinates.elev ?? 0,
			twilight,
			timeIso
		});
	};

	const handleApplyFavorite = (id: string) => {
		loadFavorite(id);
		// No need to call refetch; coordinate/twilight/time changes trigger it automatically
	};

	return (
		<div className='flex min-h-screen flex-col'>
			<Navbar onRefresh={refetch} />
			<main className='mx-auto flex w/full max-w-7xl flex-1 flex-col gap-8 px-6 py-10 lg:flex-row'>
				<div className='w-full lg:max-w-xl space-y-4'>
					<VisibleList
						planets={visibleData?.visible_planets ?? []}
						moon={visibleData?.moon}
						sunAltitudeDeg={visibleData?.sun_altitude_deg}
						loading={loading}
						error={error}
						onRetry={refetch}
					/>

					{/* Favorites panel */}
					<div className='glass-panel rounded-3xl p-4'>
						<div className='flex items-center justify-between gap-3'>
							<div>
								<h2 className='text-base font-semibold text-white'>Favorite sky views</h2>
								<p className='text-xs text-textSecondary'>
									Save your current coordinates and settings, then quickly jump back to them later.
								</p>
							</div>
							<button
								type='button'
								onClick={handleSaveCurrentView}
								className='rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white hover:bg-white/10'
							>
								Save current view
							</button>
						</div>

						{favorites.length === 0 ? (
							<p className='mt-3 text-xs text-textSecondary'>
								No favorites yet. Adjust your location or time, then click{' '}
								<span className='font-semibold'>Save current view</span>.
							</p>
						) : (
							<ul className='mt-4 space-y-2'>
								{favorites.map(fav => (
									<li
										key={fav.id}
										className='flex items-center justify-between rounded-2xl bg-surfaceAlt/60 px-3 py-2 text-xs'
									>
										<button
											type='button'
											onClick={() => handleApplyFavorite(fav.id)}
											className='flex-1 text-left hover:underline'
										>
											<span className='block font-medium text-white truncate'>{fav.name}</span>
											<span className='block text-[11px] text-textSecondary'>
												{fav.lat.toFixed(2)}, {fav.lon.toFixed(2)} • {fav.twilight}
											</span>
										</button>
										<button
											type='button'
											onClick={() => removeFavorite(fav.id)}
											className='ml-2 text-[11px] text-textSecondary hover:text-red-400'
										>
											✕
										</button>
									</li>
								))}
							</ul>
						)}
					</div>
				</div>

				<div className='flex w-full flex-1 flex-col gap-4'>
					<div className='glass-panel rounded-3xl p-4'>
						<h2 className='text-lg font-semibold text-white'>Observation Map</h2>
						<p className='text-sm text-textSecondary'>
							View your location on the globe. Expand to fullscreen for map controls and drag to adjust
							coordinates.
						</p>
					</div>
					<MiniMap
						coordinates={coordinates}
						onCenterChange={handleCenterChange}
						onEnterFullscreen={() => navigate('/home/map')}
					/>
				</div>
			</main>
			<Footer />
		</div>
	);
}
