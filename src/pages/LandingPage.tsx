import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LocationForm } from '../components/LocationForm';
import { useHomeContext } from '../context/HomeContext';
import { getBrowserGeolocation } from '../lib/geolocation';
import { isoToLocalInput } from '../lib/format';
import ShootingStars from '../components/ShootingStars';

export function LandingPage() {
  const navigate = useNavigate();
  const { coordinates, twilight, timeIso, setCoordinates, setTwilight, setTimeIso, setError } = useHomeContext();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (values: { lat: number; lon: number; elev: number; twilight: typeof twilight; time?: string }) => {
    setSubmitting(true);
    setCoordinates({ lat: values.lat, lon: values.lon, elev: values.elev });
    setTwilight(values.twilight);
    setTimeIso(values.time);
    setError(null);
    navigate('/home');
  };

  const handleUseGeolocation = async () => {
    const result = await getBrowserGeolocation();
    setCoordinates({ lat: result.lat, lon: result.lon, elev: result.elev ?? coordinates.elev });
    return result;
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <ShootingStars />
      <div className="grid w-full max-w-6xl gap-12 lg:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col justify-center gap-8 text-white">
          <div className="flex flex-col gap-4">
            <p className="text-sm uppercase tracking-[0.5rem] text-textSecondary/70">Stargazer</p>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
              Constellations &amp; Planets Above You
            </h1>
            <p className="text-lg text-textSecondary">
              See which celestial bodies are visible from your location in real time. Enter your coordinates or use the automatic
              location detection to begin your observation session.
            </p>
          </div>
          <ul className="grid gap-4 text-sm text-textSecondary">
            <li className="rounded-2xl border border-white/10 bg-surfaceAlt/50 px-4 py-3">
              Precise planet positions using NASA JPL ephemeris data.
            </li>
            <li className="rounded-2xl border border-white/10 bg-surfaceAlt/50 px-4 py-3">
              Adjustable twilight conditions for accurate darkness levels.
            </li>
            <li className="rounded-2xl border border-white/10 bg-surfaceAlt/50 px-4 py-3">
              Save your favorite coordinates for quick access on your next visit.
            </li>
          </ul>
        </div>
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
    </main>
  );
}
