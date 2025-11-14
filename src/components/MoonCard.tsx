import { MoonInfo } from '../lib/api';
import { formatAltitude, formatAzimuth, formatIllumination } from '../lib/format';

interface MoonCardProps {
  moon: MoonInfo;
}

export function MoonCard({ moon }: MoonCardProps) {
  return (
    <div className="glass-panel flex flex-col gap-2 rounded-3xl p-6">
      <div className="text-sm uppercase tracking-wide text-textSecondary">Moon</div>
      <div className="text-2xl font-semibold text-white">{formatIllumination(moon.illumination_fraction)}</div>
      <div className="grid grid-cols-2 gap-4 text-sm text-textSecondary">
        <div>
          <p className="text-xs uppercase tracking-wide text-textSecondary/70">Altitude</p>
          <p className="text-base font-medium text-textPrimary">{formatAltitude(moon.altitude_deg)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-textSecondary/70">Azimuth</p>
          <p className="text-base font-medium text-textPrimary">{formatAzimuth(moon.azimuth_deg)}</p>
        </div>
      </div>
    </div>
  );
}
