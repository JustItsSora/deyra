'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, Zap, Radar, ScrollText, CheckCircle2, Circle, AlertCircle } from 'lucide-react';

const ROWS = [
  { icon: ShieldCheck, name: 'Anti-invitaciones', final: 'ok' as const },
  { icon: Zap, name: 'Anti-nuke (audit log)', final: 'ok' as const },
  { icon: Radar, name: 'Honeypot en #free-gifts', final: 'ok' as const },
  { icon: ScrollText, name: 'Registro de mensajes', final: 'warn' as const },
];

/** Retrato con marco en arco, anillos rúnicos y panel que se activa fila a fila. */
export default function HeroStage() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setStep(ROWS.length); return; }
    const timers = ROWS.map((_, i) => window.setTimeout(() => setStep(i + 1), 1500 + i * 650));
    return () => timers.forEach(window.clearTimeout);
  }, []);

  return (
    <div className="stage" aria-hidden="true">
      <svg className="pt-rings" viewBox="0 0 400 400" fill="none">
        <g className="ring ring-a" stroke="currentColor" strokeWidth="1">
          <circle cx="200" cy="200" r="190" strokeDasharray="2 9" opacity=".55" />
          <path d="M200 4 L206 12 L200 20 L194 12Z M200 380 L206 388 L200 396 L194 388Z M4 200 L12 194 L20 200 L12 206Z M380 200 L388 194 L396 200 L388 206Z" fill="currentColor" stroke="none" />
        </g>
        <g className="ring ring-b" stroke="currentColor" strokeWidth="1">
          <circle cx="200" cy="200" r="168" opacity=".3" />
          <circle cx="200" cy="200" r="168" strokeDasharray="60 140" strokeWidth="2" opacity=".8" />
        </g>
      </svg>

      <div className="pt-arch">
        <img className="pt-img" src="/danica.jpg" alt="" width={736} height={736} fetchPriority="high" />
        <span className="pt-gem" />
        <span className="pt-sweep" />
        <span className="pt-shade" />
      </div>

      <div className="pt-panel mock">
        <div className="mock-bar">
          <span className="mock-dot" /><span className="mock-dot" /><span className="mock-dot" />
          <span className="mock-title">Deyra · Automod</span>
        </div>
        <div className="mock-body">
          {ROWS.map(({ icon: Icon, name, final }, i) => {
            const state = step > i ? final : 'off';
            return (
              <div className="mock-row" key={name}>
                <span className="name"><Icon size={16} />{name}</span>
                <span className={`pill ${state === 'off' ? 'off' : state}`}>
                  {state === 'ok' ? <CheckCircle2 size={14} /> : state === 'warn' ? <AlertCircle size={14} /> : <Circle size={14} />}
                  {state === 'ok' ? 'Activo' : state === 'warn' ? 'Sin canal' : 'Apagado'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
