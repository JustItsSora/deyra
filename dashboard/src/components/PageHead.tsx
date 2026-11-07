'use client';

import { CircleCheck, CircleX } from 'lucide-react';
import { useBotStatus } from './BotStatusProvider';

// Cabecera estándar de sección. El estado del bot se toma del contexto
// (BotStatusProvider) o del prop `status`; si no hay ninguno, no se pinta.

export default function PageHead({
  title,
  description,
  status,
}: {
  title: string;
  description?: string;
  status?: 'online' | 'offline' | null;
}) {
  const contextStatus = useBotStatus();
  const resolved = status !== undefined ? status : contextStatus;

  return (
    <header className="page-head">
      <div className="page-head-main">
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {resolved === 'online' && (
        <span className="pill ok page-head-status"><CircleCheck size={15} aria-hidden="true" />Bot en línea</span>
      )}
      {resolved === 'offline' && (
        <span className="pill warn page-head-status"><CircleX size={15} aria-hidden="true" />Bot sin respuesta</span>
      )}
    </header>
  );
}
