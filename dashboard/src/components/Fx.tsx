'use client';

import { useEffect } from 'react';
import { play, type SoundKind } from '@/lib/sound';

/** Sonido delegado en los controles. Sin capas visuales ni animaciones de fondo. */
export default function Fx() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.('button,a[href],summary,[role="option"],label.checkline') as HTMLElement | null;
      if (!el) return;
      if ((el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true') return;
      if (el.matches('[role="switch"]')) return; // el Toggle suena por su cuenta (on/off)
      const forced = el.dataset.sound;
      if (forced === 'none') return;
      const kind: SoundKind = (forced as SoundKind | undefined)
        ?? (el.matches('.listbox-trigger,.switcher-btn,summary') ? 'open'
          : el.matches('.side-link,.guild-card,.nav-links a,.brand') ? 'nav' : 'click');
      play(kind);
    };

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return null;
}
