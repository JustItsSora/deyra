import { Loader2 } from 'lucide-react';

export default function GuildLoading() {
  return (
    <main className="content">
      <div className="empty" role="status" aria-live="polite">
        <Loader2 className="icon spin" strokeWidth={1.5} aria-hidden="true" />
        <h3>Cargando sección</h3>
        <p>Leyendo canales, roles y ajustes del servidor.</p>
      </div>
    </main>
  );
}
