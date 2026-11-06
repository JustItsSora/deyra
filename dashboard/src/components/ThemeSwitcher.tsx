'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Palette } from 'lucide-react';

export type ThemeId = 'jade' | 'ambar' | 'medianoche' | 'ciruela';

const THEMES: { id: ThemeId; name: string; dot: string }[] = [
  { id: 'jade', name: 'Jade', dot: '#5eb7ae' },
  { id: 'ambar', name: 'Ámbar', dot: '#d4a24e' },
  { id: 'medianoche', name: 'Medianoche', dot: '#7aa2f7' },
  { id: 'ciruela', name: 'Ciruela', dot: '#b48cf2' },
];

const STORAGE_KEY = 'deyra-theme';

export function applyTheme(theme: ThemeId) {
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* storage unavailable */ }
}

export default function ThemeSwitcher() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeId>('jade');
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = (document.documentElement.dataset.theme || 'jade') as ThemeId;
    setTheme(THEMES.some((t) => t.id === saved) ? saved : 'jade');

    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  return (
    <div className="side-theme" ref={rootRef}>
      <button
        type="button"
        className="side-theme-btn"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="theme-dot" style={{ background: current.dot }} aria-hidden="true" />
        <Palette size={15} aria-hidden="true" style={{ color: 'var(--muted)' }} />
        <span className="small muted">Tema: {current.name}</span>
      </button>

      {open && (
        <div className="side-theme-pop" role="listbox" aria-label="Tema de color">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="option"
              aria-selected={t.id === theme}
              className="theme-opt"
              onClick={() => {
                setTheme(t.id);
                applyTheme(t.id);
                setOpen(false);
              }}
            >
              <span className="theme-dot" style={{ background: t.dot }} aria-hidden="true" />
              {t.name}
              {t.id === theme && <Check size={15} aria-hidden="true" style={{ marginLeft: 'auto', color: 'var(--accent)' }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
