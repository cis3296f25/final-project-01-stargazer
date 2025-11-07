import { useState } from 'react';
import { type Twilight } from '../lib/api';
import { TwilightSelect } from './TwilightSelect';

interface LocationFormValues {
  lat: string;
  lon: string;
  elev: string;
  twilight: Twilight;
  time?: string;
}

interface LocationFormProps {
  initialValues: LocationFormValues;
  onSubmit: (values: { lat: number; lon: number; elev: number; twilight: Twilight; time?: string }) => void;
  onUseGeolocation?: () => Promise<{ lat: number; lon: number; elev?: number }>;
  submitting?: boolean;
}

type Errors = Partial<Record<'lat' | 'lon' | 'elev' | 'time', string>>;

const LAT_MIN = -90;
const LAT_MAX = 90;
const LON_MIN = -180;
const LON_MAX = 180;
const ELEV_MIN = -500;
const ELEV_MAX = 9000;

export function LocationForm({ initialValues, onSubmit, onUseGeolocation, submitting }: LocationFormProps) {
  const [values, setValues] = useState<LocationFormValues>(initialValues);
  const [errors, setErrors] = useState<Errors>({});

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleTwilightChange = (twilight: Twilight) => {
    setValues((prev) => ({ ...prev, twilight }));
  };

  const validate = (): boolean => {
    const nextErrors: Errors = {};
    const lat = Number(values.lat);
    if (!Number.isFinite(lat) || lat < LAT_MIN || lat > LAT_MAX) {
      nextErrors.lat = 'Latitude must be between -90 and 90 degrees.';
    }

    const lon = Number(values.lon);
    if (!Number.isFinite(lon) || lon < LON_MIN || lon > LON_MAX) {
      nextErrors.lon = 'Longitude must be between -180 and 180 degrees.';
    }

    if (values.elev) {
      const elev = Number(values.elev);
      if (!Number.isFinite(elev) || elev < ELEV_MIN || elev > ELEV_MAX) {
        nextErrors.elev = 'Elevation must be between -500m and 9000m.';
      }
    }

    if (values.time && Number.isNaN(Date.parse(values.time))) {
      nextErrors.time = 'Enter a valid ISO date/time.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    onSubmit({
      lat: Number(values.lat),
      lon: Number(values.lon),
      elev: values.elev ? Number(values.elev) : 0,
      twilight: values.twilight,
      time: values.time ? new Date(values.time).toISOString() : undefined
    });
  };

  const handleUseGeolocation = async () => {
    if (!onUseGeolocation) {
      return;
    }
    try {
      const coords = await onUseGeolocation();
      setValues((prev) => ({
        ...prev,
        lat: coords.lat.toFixed(4),
        lon: coords.lon.toFixed(4),
        elev: coords.elev !== undefined ? coords.elev.toFixed(0) : prev.elev
      }));
      setErrors((prev) => ({ ...prev, lat: undefined, lon: undefined }));
    } catch (error) {
      setErrors((prev) => ({ ...prev, lat: (error as Error).message }));
    }
  };

  return (
    <form className="glass-panel flex flex-col gap-6 rounded-3xl p-8" onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col gap-2">
        <label className="field-label" htmlFor="lat">
          Latitude
        </label>
        <input
          id="lat"
          name="lat"
          type="number"
          step="0.0001"
          className="field-input"
          value={values.lat}
          onChange={handleInputChange}
          aria-invalid={Boolean(errors.lat)}
        />
        {errors.lat ? <p className="text-sm text-danger">{errors.lat}</p> : null}
      </div>

      <div className="flex flex-col gap-2">
        <label className="field-label" htmlFor="lon">
          Longitude
        </label>
        <input
          id="lon"
          name="lon"
          type="number"
          step="0.0001"
          className="field-input"
          value={values.lon}
          onChange={handleInputChange}
          aria-invalid={Boolean(errors.lon)}
        />
        {errors.lon ? <p className="text-sm text-danger">{errors.lon}</p> : null}
      </div>

      <div className="flex flex-col gap-2">
        <label className="field-label" htmlFor="elev">
          Elevation (m)
        </label>
        <input
          id="elev"
          name="elev"
          type="number"
          step="1"
          className="field-input"
          value={values.elev}
          onChange={handleInputChange}
          aria-invalid={Boolean(errors.elev)}
          placeholder="Optional"
        />
        {errors.elev ? <p className="text-sm text-danger">{errors.elev}</p> : null}
      </div>

      <div className="flex flex-col gap-3">
        <label className="field-label" htmlFor="time">
          Time (optional)
        </label>
        <input
          id="time"
          name="time"
          type="datetime-local"
          className="field-input"
          value={values.time ?? ''}
          onChange={handleInputChange}
          aria-invalid={Boolean(errors.time)}
        />
        {errors.time ? <p className="text-sm text-danger">{errors.time}</p> : null}
      </div>

      <TwilightSelect value={values.twilight} onChange={handleTwilightChange} label="Twilight" />

      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <button type="submit" className="button-primary flex-1" disabled={submitting}>
          {submitting ? 'Loading…' : 'View sky'}
        </button>
        <button
          type="button"
          className="flex-1 rounded-xl border border-accent/50 bg-transparent px-6 py-3 text-sm font-medium text-accent transition hover:bg-accent/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          onClick={handleUseGeolocation}
        >
          Use my location
        </button>
      </div>
    </form>
  );
}
