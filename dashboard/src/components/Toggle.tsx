'use client';

import { play } from '@/lib/sound';

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
      onClick={() => {
        const next = !checked;
        play(next ? 'on' : 'off');
        onChange(next);
      }}
    />
  );
}
