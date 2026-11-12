'use client';

import { ServerCrash } from 'lucide-react';
import EmptyState from '@/components/EmptyState';

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="content">
      <EmptyState
        icon={ServerCrash}
        title="No se pudo cargar esta vista"
        action={<button type="button" className="btn btn-ghost btn-sm" onClick={reset}>Reintentar</button>}
      >
        <p>Ocurrió un fallo al leer los datos del servidor. Puedes volver a intentarlo sin perder tu sesión.</p>
      </EmptyState>
    </main>
  );
}
