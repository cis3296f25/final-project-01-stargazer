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

  const handleCenterChange = (next: Coordinates) => {
    setCoordinates(next);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar onRefresh={refetch} />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-10 lg:flex-row">
        <div className="w-full lg:max-w-xl">
          <VisibleList
            planets={visibleData?.visible_planets ?? []}
            moon={visibleData?.moon}
            sunAltitudeDeg={visibleData?.sun_altitude_deg}
            constellations={visibleData?.constellations}
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
