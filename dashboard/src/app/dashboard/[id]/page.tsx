import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ShieldCheck, Radar, Zap, ChevronRight, Users, Hash, ShieldUser, TriangleAlert,
  Settings2, DoorOpen, ScrollText, Rocket, Ticket, TrendingUp, UserRoundPlus, Music,
} from 'lucide-react';
import { botGet, BotApiError } from '@/lib/bot';
import AccessNotice from '@/components/AccessNotice';
import StatusPill from '@/components/StatusPill';
import CountUp from '@/components/CountUp';

export const dynamic = 'force-dynamic';

type Overview = {
  id: string;
  name: string;
  memberCount: number | null;
  channelCount: number;
  roleCount: number;
  boostTier: number;
  warnsLast30d: number | null;
  security: { automod: boolean; honeypot: boolean; antinuke: boolean };
};

export default async function GuildOverview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let overview: Overview | null = null;
  try {
    overview = await botGet<Overview>(`/guilds/${id}/overview`);
  } catch (err) {
    if (err instanceof BotApiError && err.status === 404) notFound();
    console.error('[overview]', err);
    return <AccessNotice kind="bot-offline" />;
  }
  if (!overview) return <AccessNotice kind="bot-offline" />;

  const securityItems = [
    { href: '/automod', icon: ShieldCheck, name: 'Automod', on: overview.security.automod, onText: 'Activo', offText: 'Desactivado' },
    { href: '/honeypot', icon: Radar, name: 'Honeypot', on: overview.security.honeypot, onText: 'Activo', offText: 'Desactivado' },
    { href: '/seguridad', icon: Zap, name: 'Anti-nuke', on: overview.security.antinuke, onText: 'Activo', offText: 'Desactivado' },
  ];

  const quickLinks = [
    { href: '/general', icon: Settings2, label: 'General', desc: 'Prefijo e idioma' },
    { href: '/automod', icon: ShieldCheck, label: 'Automod', desc: 'Filtros y escalada' },
    { href: '/honeypot', icon: Radar, label: 'Honeypot', desc: 'Canal señuelo' },
    { href: '/seguridad', icon: Zap, label: 'Anti-nuke', desc: 'Vigilancia audit log' },
    { href: '/tickets', icon: Ticket, label: 'Tickets', desc: 'Soporte y panel' },
    { href: '/niveles', icon: TrendingUp, label: 'Niveles', desc: 'XP y recompensas' },
    { href: '/autorole', icon: UserRoundPlus, label: 'Autorole', desc: 'Roles al entrar' },
    { href: '/musica', icon: Music, label: 'Música', desc: 'Reproductor y 24/7' },
    { href: '/bienvenida', icon: DoorOpen, label: 'Bienvenidas', desc: 'Mensajes y tarjetas' },
    { href: '/registros', icon: ScrollText, label: 'Registros', desc: 'Canales de log' },
  ];

  return (
    <main className="content">
      <header className="banner">
        <div className="banner-copy">
          <span className="kicker">Resumen del servidor</span>
          <h1>{overview.name}</h1>
          <p>Estado del servidor y accesos directos a cada sección de configuración.</p>
        </div>
        <div className="banner-art" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/danica.jpg" alt="" width={736} height={736} />
        </div>
      </header>

      <div className="stat-grid">
        <div className="stat"><div className="k"><Users size={14} aria-hidden="true" /> Miembros</div><div className="v">{overview.memberCount != null ? <CountUp value={overview.memberCount} /> : '—'}</div></div>
        <div className="stat"><div className="k"><Hash size={14} aria-hidden="true" /> Canales</div><div className="v"><CountUp value={overview.channelCount} /></div></div>
        <div className="stat"><div className="k"><ShieldUser size={14} aria-hidden="true" /> Roles</div><div className="v"><CountUp value={overview.roleCount} /></div></div>
        <div className="stat"><div className="k"><TriangleAlert size={14} aria-hidden="true" /> Infracciones 30d</div><div className="v">{overview.warnsLast30d != null ? <CountUp value={overview.warnsLast30d} /> : '—'}</div><div className="sub">quedan en /warnings</div></div>
      </div>

      <section className="section-block" aria-label="Estado de las protecciones">
        <h2>Protecciones</h2>
        <div className="card card-pad" style={{ display: 'grid', gap: 4 }}>
          {securityItems.map(({ href, icon: Icon, name, on, onText, offText }) => (
            <Link key={href} href={`/dashboard/${id}${href}`} className="setting-row" style={{ textDecoration: 'none', color: 'inherit', borderRadius: 'var(--radius-md)' }}>
              <span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 650 }}>
                  <Icon size={18} aria-hidden="true" style={{ color: on ? 'var(--ok)' : 'var(--faint)' }} />
                  {name}
                </span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <StatusPill state={on ? 'ok' : 'off'} okText={onText} offText={offText} />
                <ChevronRight size={16} aria-hidden="true" className="muted" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-block" aria-label="Secciones">
        <h2>Configurar</h2>
        <div className="guild-grid" style={{ marginTop: 8 }}>
          {quickLinks.map(({ href, icon: Icon, label, desc }) => (
            <Link key={href} href={`/dashboard/${id}${href}`} className="guild-card" aria-label={`Ir a ${label}`}>
              <span className="guild-icon" style={{ width: 44, height: 44, fontSize: 0 }}><Icon size={20} aria-hidden="true" /></span>
              <span style={{ minWidth: 0 }}>
                <span className="gname">{label}</span>
                <span className="grole">{desc}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <div className="callout mt" role="note">
        <Rocket className="icon" aria-hidden="true" />
        <span><strong>Consejo:</strong> activa el anti-nuke en modo <em>solo registro</em> unos días y revisa el canal de logs antes de pasar a <em>derank</em> o <em>ban</em>.</span>
      </div>
    </main>
  );
}
