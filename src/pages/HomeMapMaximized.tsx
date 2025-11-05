import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { FullscreenMap } from '../components/FullscreenMap';
import { InfoPanel } from '../components/InfoPanel';
import { useHomeContext } from '../context/HomeContext';
import type { Coordinates } from '../lib/map';

export function HomeMapMaximized() {
  const navigate = useNavigate();
  const { coordinates, setCoordinates, visibleData, refetch } = useHomeContext();

  const handleCenterChange = (next: Coordinates) => {
    setCoordinates(next);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar onRefresh={refetch} />
      <main className="flex flex-1 flex-col gap-6 px-6 py-6 lg:flex-row">
        <div className="h-[60vh] w-full flex-1 overflow-hidden rounded-[32px] lg:h-auto">
          <FullscreenMap coordinates={coordinates} onCenterChange={handleCenterChange} />
        </div>
        <InfoPanel coordinates={coordinates} data={visibleData ?? null} onExit={() => navigate('/home')} />
      </main>
    </div>
  );
}
