import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { VisibleList } from '../components/VisibleList';
import { MiniMap } from '../components/MiniMap';
import { Footer } from '../components/Footer';
import { useHomeContext } from '../context/HomeContext';
import type { Coordinates } from '../lib/map';

export function HomeMapMinimized() {
  const navigate = useNavigate();
  const { coordinates, setCoordinates, visibleData, loading, error, refetch } = useHomeContext();

  const [draftCoordinates, setDraftCoordinates] = useState<Coordinates>(coordinates)

  useEffect(() => {
      setDraftCoordinates(coordinates);
  }, [coordinates]);

  const handleCenterChange = (next: Coordinates) => {
    setDraftCoordinates(next);
  };

  const applyDraftLocation = () => {
      setCoordinates(draftCoordinates);
      refetch();
  }

  const hasPendingChange =
    draftCoordinates.lat !== coordinates.lat ||
    draftCoordinates.lon !== coordinates.lon ||
    (draftCoordinates.elev2 ?? 0) !== (coordinates.elev2 ?? 0);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar onRefresh={refetch} />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-10 lg:flex-row">
        <div className="w-full lg:max-w-xl">
          <VisibleList
            planets={visibleData?.visible_planets ?? []}
            moon={visibleData?.moon}
            sunAltitudeDeg={visibleData?.sun_altitude_deg}
            loading={loading}
            error={error}
            onRetry={refetch}
          />
        </div>
        <div className="flex w-full flex-1 flex-col gap-4">
          <div className="glass-panel rounded-3xl p-4">
            <h2 className="text-lg font-semibold text-white">Observation Map</h2>
            <p className="text-sm text-textSecondary">
              View your location on the globe. Expand to fullscreen for map controls and drag to adjust coordinates.
            </p>
          </div>
          <MiniMap
            coordinates={draftCoordinates}
            onCenterChange={handleCenterChange}
            onEnterFullscreen={() => navigate('/home/map')}
          />
          <div className ="flex justify-end">
            <button
                type="button"
                onClick={applyDraftLocation}
                disabled={!hasPendingChange || loading}
                className={`rounded-full px-4 py-2 text-sm font-medium ${
                                !hasPendingChange || loading
                                  ? 'cursor-not-allowed bg-gray-600/60 text-gray-300'
                                  : 'bg-indigo-500 text-white hover:bg-indigo-400'
                              }`}
                >
                    {loading ? 'Updating…' : hasPendingChange ? 'Update location' : 'Location up to date'}
                </button>
            </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
