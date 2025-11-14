import { type Twilight } from '../lib/api';
import classNames from 'classnames';

interface TwilightSelectProps {
  value: Twilight;
  onChange: (value: Twilight) => void;
  label?: string;
  size?: 'sm' | 'md';
}

const OPTIONS: { value: Twilight; label: string; description: string }[] = [
  { value: 'civil', label: 'Civil', description: 'Sun 0°-6° below horizon' },
  { value: 'nautical', label: 'Nautical', description: 'Sun 6°-12° below horizon' },
  { value: 'astronomical', label: 'Astronomical', description: 'Sun 12°-18° below horizon' }
];

export function TwilightSelect({ value, onChange, label, size = 'md' }: TwilightSelectProps) {
  return (
    <div className="flex flex-col gap-2">
      {label ? <span className="field-label">{label}</span> : null}
      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map((option) => {
          const isActive = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              className={classNames(
                'rounded-lg border px-3 py-2 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                size === 'sm' ? 'text-xs' : 'text-sm',
                isActive
                  ? 'border-accent bg-accent/20 text-textPrimary'
                  : 'border-transparent bg-surfaceAlt/60 text-textSecondary hover:border-accent/40 hover:text-textPrimary'
              )}
              onClick={() => onChange(option.value)}
            >
              <span className="font-semibold">{option.label}</span>
              <span className="mt-1 block text-[0.7rem] text-textSecondary/80">{option.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
