'use client';

import { play, burst } from '@/lib/sound';

type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  loading?: boolean;
};

export default function Toggle({ checked, onChange, label, disabled, loading }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-busy={loading || undefined}
      disabled={disabled}
      className={`switch${loading ? ' loading' : ''}`}
      onClick={(e) => {
        const next = !checked;
        play(next ? 'on' : 'off');
        if (next) {
          const r = e.currentTarget.getBoundingClientRect();
          burst(r.left + r.width * 0.72, r.top + r.height / 2);
        }
        onChange(next);
      }}
    />
  );
}
