import { Loader2 } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <main className="content">
      <div className="empty" role="status" aria-live="polite">
        <Loader2 className="icon spin" strokeWidth={1.5} aria-hidden="true" />
        <h3>Leyendo configuración</h3>
        <p>Consultando el estado actual del servidor en Deyra.</p>
      </div>
    </main>
  );
}
