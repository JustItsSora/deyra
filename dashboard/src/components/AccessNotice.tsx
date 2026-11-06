import EmptyState from '@/components/EmptyState';
import { inviteUrl } from '@/lib/discord';
import { Bot, SearchX, ShieldAlert } from 'lucide-react';

type AccessNoticeProps =
  | { kind: 'bot-offline' }
  | { kind: 'not-found'; guildId: string }
  | { kind: 'forbidden'; guildId: string };

export default function AccessNotice(props: AccessNoticeProps) {
  if (props.kind === 'bot-offline') {
    return (
      <main className="content" style={{ paddingTop: 64 }}>
        <EmptyState
          icon={Bot}
          title="El bot no responde ahora mismo"
          action={<a className="btn btn-primary btn-sm" href=".">Reintentar</a>}
        >
          <p>El panel necesita hablar con Deyra para leer y guardar la configuración. Si el bot se está reiniciando (tarda unos segundos en arrancar) o no está en línea, inténtalo de nuevo.</p>
        </EmptyState>
      </main>
    );
  }

  if (props.kind === 'not-found') {
    const invite = inviteUrl(props.guildId);
    return (
      <main className="content" style={{ paddingTop: 64 }}>
        <EmptyState
          icon={SearchX}
          title="No podemos abrir ese servidor"
          action={invite ? <a className="btn btn-primary" href={invite}>Añadir Deyra a este servidor</a> : undefined}
        >
          <p>O el bot no está en ese servidor, o no tienes permiso de administrador ahí con tu cuenta de Discord. Si acabas de darte permisos, vuelve a cargar en unos segundos.</p>
        </EmptyState>
      </main>
    );
  }

  return (
    <main className="content" style={{ paddingTop: 64 }}>
      <EmptyState icon={ShieldAlert} title="Sin permiso">
        <p>Solo quien tenga permiso de administrador o de gestión del servidor puede ver y cambiar la configuración.</p>
      </EmptyState>
    </main>
  );
}
