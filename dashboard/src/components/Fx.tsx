'use client';

import { useEffect, useRef } from 'react';
import { play, burst, type SoundKind } from '@/lib/sound';

type Mote = { x: number; y: number; r: number; vy: number; vx: number; a: number; ph: number; gem: boolean };
type Spark = { x: number; y: number; vx: number; vy: number; life: number; r: number; gem: boolean };

/** Capa global: fondo ambiental, motas de cristal, foco que sigue el cursor,
    brillo en bordes de tarjetas, chispas y sonido delegado en los clics. */
export default function Fx() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const cv = canvasRef.current;
    if (!cv) return;
    const g = cv.getContext('2d');
    if (!g) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    let w = 0, h = 0, dpr = 1, raf = 0, frame = 0;
    let rgb = '82,214,200';
    const motes: Mote[] = [];
    const sparks: Spark[] = [];

    const readColor = () => {
      const v = getComputedStyle(root).getPropertyValue('--accent-rgb').trim();
      if (v) rgb = v;
    };

    const seed = () => {
      motes.length = 0;
      const n = Math.round(Math.min(48, Math.max(16, w / 34)));
      for (let i = 0; i < n; i++) {
        motes.push({
          x: Math.random() * w, y: Math.random() * h,
          r: 0.7 + Math.random() * 1.8, vy: 0.08 + Math.random() * 0.28,
          vx: (Math.random() - 0.5) * 0.12, a: 0.25 + Math.random() * 0.55,
          ph: Math.random() * 6.28, gem: Math.random() < 0.3,
        });
      }
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    const lozenge = (x: number, y: number, r: number) => {
      g.beginPath();
      g.moveTo(x, y - r * 1.6); g.lineTo(x + r, y); g.lineTo(x, y + r * 1.6); g.lineTo(x - r, y);
      g.closePath(); g.fill();
    };

    const draw = (t: number) => {
      g.clearRect(0, 0, w, h);
      if (frame++ % 90 === 0) readColor();

      for (const m of motes) {
        m.y -= m.vy; m.x += m.vx + Math.sin(t / 2600 + m.ph) * 0.08;
        if (m.y < -10) { m.y = h + 10; m.x = Math.random() * w; }
        if (m.x < -10) m.x = w + 10; else if (m.x > w + 10) m.x = -10;
        const tw = 0.55 + 0.45 * Math.sin(t / 900 + m.ph);
        g.fillStyle = `rgba(${rgb},${(m.a * tw * 0.18).toFixed(3)})`;
        g.beginPath(); g.arc(m.x, m.y, m.r * 4, 0, 6.283); g.fill();
        g.fillStyle = `rgba(${rgb},${(m.a * tw).toFixed(3)})`;
        if (m.gem) lozenge(m.x, m.y, m.r); else { g.beginPath(); g.arc(m.x, m.y, m.r * 0.7, 0, 6.283); g.fill(); }
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx; s.y += s.vy; s.vy += 0.07; s.vx *= 0.985; s.life -= 0.022;
        if (s.life <= 0) { sparks.splice(i, 1); continue; }
        g.fillStyle = `rgba(${s.gem ? '234,223,202' : rgb},${s.life.toFixed(3)})`;
        if (s.gem) lozenge(s.x, s.y, s.r); else { g.beginPath(); g.arc(s.x, s.y, s.r, 0, 6.283); g.fill(); }
      }
    };

    const loop = (t: number) => { draw(t); raf = requestAnimationFrame(loop); };

    const start = () => {
      cancelAnimationFrame(raf);
      if (reduce.matches) { g.clearRect(0, 0, w, h); return; }
      raf = requestAnimationFrame(loop);
    };

    /* Puntero: foco global + coordenadas normalizadas para el parallax + brillo por tarjeta */
    let pending = false, px = 0, py = 0;
    const onMove = (e: PointerEvent) => {
      px = e.clientX; py = e.clientY;
      const card = (e.target as HTMLElement | null)?.closest?.('.card,.feature,.guild-card,.stat,.mock') as HTMLElement | null;
      if (card) {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--cx', `${e.clientX - r.left}px`);
        card.style.setProperty('--cy', `${e.clientY - r.top}px`);
      }
      if (pending || reduce.matches) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        root.style.setProperty('--mx', `${px}px`);
        root.style.setProperty('--my', `${py}px`);
        root.style.setProperty('--nx', ((px / window.innerWidth) * 2 - 1).toFixed(3));
        root.style.setProperty('--ny', ((py / window.innerHeight) * 2 - 1).toFixed(3));
      });
    };

    const onBurst = (e: Event) => {
      if (reduce.matches) return;
      const { x, y } = (e as CustomEvent<{ x: number; y: number }>).detail;
      for (let i = 0; i < 14; i++) {
        const ang = Math.random() * 6.283, sp = 1.2 + Math.random() * 3.2;
        sparks.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 1.4, life: 1, r: 1 + Math.random() * 1.8, gem: i % 3 === 0 });
      }
    };

    /* Sonido delegado: cualquier control interactivo suena sin tocar cada componente */
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.('button,a[href],summary,[role="option"],label.checkline') as HTMLElement | null;
      if (!el) return;
      if ((el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true') return;
      if (el.matches('[role="switch"]')) return; // el Toggle suena por su cuenta (on/off)
      const forced = el.dataset.sound;
      if (forced === 'none') return;
      const kind: SoundKind = (forced as SoundKind | undefined)
        ?? (el.matches('.listbox-trigger,.switcher-btn,.side-theme-btn,summary') ? 'open'
          : el.matches('.side-link,.guild-card,.nav-links a,.brand') ? 'nav' : 'click');
      play(kind);
      if (el.matches('.btn-primary')) {
        const r = el.getBoundingClientRect();
        burst(e.detail === 0 ? r.left + r.width / 2 : e.clientX, e.detail === 0 ? r.top + r.height / 2 : e.clientY);
      }
    };

    resize(); readColor(); start();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('deyra:burst', onBurst);
    document.addEventListener('click', onClick);
    reduce.addEventListener('change', start);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('deyra:burst', onBurst);
      document.removeEventListener('click', onClick);
      reduce.removeEventListener('change', start);
    };
  }, []);

  return (
    <div className="ambient" aria-hidden="true">
      <div className="amb-glow amb-a" />
      <div className="amb-glow amb-b" />
      <div className="amb-spot" />
      <canvas ref={canvasRef} className="amb-motes" />
      <div className="amb-grain" />
    </div>
  );
}
