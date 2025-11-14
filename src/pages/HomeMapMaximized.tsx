import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { FullscreenMap } from '../components/FullscreenMap';
import { InfoPanel } from '../components/InfoPanel';
import { useHomeContext } from '../context/HomeContext';
import type { Coordinates } from '../lib/map';

export function HomeMapMaximized() {
  const navigate = useNavigate();
  const { coordinates, setCoordinates, visibleData, refetch } = useHomeContext();

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
    (draftCoordinates.elev ?? 0) !== (coordinates.elev ?? 0);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar onRefresh={refetch} />
      <main className="flex flex-1 flex-col gap-6 px-6 py-6 lg:flex-row">
        <div className="h-[60vh] w-full flex-1 overflow-hidden rounded-[32px] lg:h-auto">
          <FullscreenMap coordinates={draftCoordinates} onCenterChange={handleCenterChange} />
        </div>
        <div className="flex flex-col gap-4">
                  <InfoPanel
                    coordinates={coordinates} // still using real coords
                    data={visibleData ?? null}
                    onExit={() => navigate('/home')}
                  />
        <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={applyDraftLocation}
                      disabled={!hasPendingChange}
                      className={`rounded-full px-4 py-2 text-sm font-medium ${
                        !hasPendingChange
                          ? 'cursor-not-allowed bg-gray-600/60 text-gray-300'
                          : 'bg-indigo-500 text-white hover:bg-indigo-400'
                      }`}
                    >
                      {hasPendingChange ? 'Update location' : 'Location up to date'}
                    </button>
                  </div>
                </div>
      </main>
    </div>
  );
}
