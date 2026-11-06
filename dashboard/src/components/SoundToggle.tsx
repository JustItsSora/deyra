'use client';

import { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { isSoundOn, setSoundOn, play } from '@/lib/sound';

export default function SoundToggle({ className = '' }: { className?: string }) {
  const [on, setOn] = useState(true);

  useEffect(() => {
    setOn(isSoundOn());
    const sync = (e: Event) => setOn((e as CustomEvent<boolean>).detail);
    window.addEventListener('deyra:sound', sync);
    return () => window.removeEventListener('deyra:sound', sync);
  }, []);

  const toggle = () => {
    const next = !on;
    setSoundOn(next);
    if (next) play('on');
  };

  return (
    <button
      type="button"
      className={`icon-btn ${className}`.trim()}
      aria-pressed={on}
      aria-label={on ? 'Silenciar sonidos del panel' : 'Activar sonidos del panel'}
      title={on ? 'Sonidos activados' : 'Sonidos silenciados'}
      data-sound="none"
      onClick={toggle}
    >
      {on ? <Volume2 size={17} aria-hidden="true" /> : <VolumeX size={17} aria-hidden="true" />}
    </button>
  );
}
