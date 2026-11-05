import Link from 'next/link';
import { ChevronRight, ShieldAlert, ServerCrash, Wand2 } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { getAdministeredGuilds } from '@/lib/guilds';
import { inviteUrl, guildIconUrl } from '@/lib/discord';
import GuildIcon from '@/components/GuildIcon';
import EmptyState from '@/components/EmptyState';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Mis servidores' };

export default async function DashboardHome() {
  const session = await getSession();
  const result = await getAdministeredGuilds();

  if (result.status === 'bot-offline') {
    return (
      <main className="content" style={{ paddingTop: 48 }}>
        <EmptyState icon={ServerCrash} title="El bot no responde ahora mismo">
          <p>El panel habla con Deyra para leer y guardar la configuración. Comprueba que el bot esté encendido y vuelve a intentarlo.</p>
          <div style={{ marginTop: 8 }}><Link className="btn btn-ghost btn-sm" href="/dashboard">Reintentar</Link></div>
        </EmptyState>
      </main>
    );
  }

  const guilds = result.status === 'ok' ? result.guilds : [];
  const present = guilds.filter((g) => g.botPresent);
  const missing = guilds.filter((g) => !g.botPresent);

  return (
    <main className="content" style={{ paddingTop: 28 }}>
      <div className="page-head">
        <h1>Hola, {session?.username}</h1>
        <p>Elige un servidor para ver y editar su configuración. Solo aparecen los servidores donde tienes permisos de gestión y Deyra está presente.</p>
      </div>

      {present.length > 0 ? (
        <div className="guild-grid">
          {present.map((g) => (
            <Link key={g.id} href={`/dashboard/${g.id}`} className="guild-card" aria-label={`Abrir configuración de ${g.name}`}>
              <GuildIcon name={g.name} iconUrl={guildIconUrl(g)} size={56} />
              <span style={{ minWidth: 0 }}>
                <span className="gname" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</span>
                <span className="grole">{g.owner ? 'Dueño' : 'Administrador'} · configurar <ChevronRight size={13} aria-hidden="true" /></span>
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState icon={ShieldAlert} title="Ningún servidor listo todavía">
          <p>Deyra no está en ninguno de los servidores que administras, o aún no tiene acceso. Añádela y vuelve aquí.</p>
        </EmptyState>
      )}

      {missing.length > 0 && (
        <section className="section-block" aria-label="Servidores sin el bot">
          <h2>Puedes añadir Deyra aquí</h2>
          <div className="guild-grid" style={{ marginTop: 10 }}>
            {missing.map((g) => {
              const invite = inviteUrl(g.id);
              return (
                <div key={g.id} className="guild-card" style={{ cursor: 'default' }}>
                  <GuildIcon name={g.name} iconUrl={guildIconUrl(g)} size={56} />
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span className="gname" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</span>
                    {invite && (
                      <a className="grole" href={invite} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-hover)', textDecoration: 'none' }}>
                        <Wand2 size={13} aria-hidden="true" /> Invitar a Deyra
                      </a>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
