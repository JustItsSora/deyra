import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ShieldCheck, Radar, Zap, ChevronRight, Users, Hash, ShieldUser, TriangleAlert,
  Settings2, DoorOpen, ScrollText, Rocket, Ticket, TrendingUp, UserRoundPlus, Music,
} from 'lucide-react';
import { botGet, BotApiError } from '@/lib/bot';
import AccessNotice from '@/components/AccessNotice';
import StatusPill from '@/components/StatusPill';
import PageHead from '@/components/PageHead';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Resumen' };

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

  const sec = overview.security ?? { automod: false, honeypot: false, antinuke: false };
  const protectionItems = [
    { href: '/automod', icon: ShieldCheck, name: 'Automod', desc: 'Filtro de spam, enlaces, menciones y mayúsculas', on: Boolean(sec.automod), onText: 'Activo', offText: 'Desactivado' },
    { href: '/honeypot', icon: Radar, name: 'Honeypot', desc: 'Canal señuelo para atrapar raids y bots', on: Boolean(sec.honeypot), onText: 'Activo', offText: 'Desactivado' },
    { href: '/seguridad', icon: Zap, name: 'Anti-nuke', desc: 'Vigilancia del audit log contra ráfagas destructivas', on: Boolean(sec.antinuke), onText: 'Activo', offText: 'Desactivado' },
  ];

  const quickLinks = [
    { href: '/general', icon: Settings2, label: 'General', desc: 'Prefijo y canales' },
    { href: '/automod', icon: ShieldCheck, label: 'Automod', desc: 'Filtros y escalada' },
    { href: '/honeypot', icon: Radar, label: 'Honeypot', desc: 'Canal señuelo' },
    { href: '/seguridad', icon: Zap, label: 'Anti-nuke', desc: 'Vigilancia audit log' },
    { href: '/tickets', icon: Ticket, label: 'Tickets', desc: 'Soporte y panel' },
    { href: '/niveles', icon: TrendingUp, label: 'Niveles', desc: 'XP y recompensas' },
    { href: '/autorole', icon: UserRoundPlus, label: 'Autorole', desc: 'Roles al entrar' },
    { href: '/musica', icon: Music, label: 'Música', desc: 'Reproductor y 24/7' },
    { href: '/bienvenida', icon: DoorOpen, label: 'Bienvenidas', desc: 'Entradas y salidas' },
    { href: '/registros', icon: ScrollText, label: 'Registros', desc: 'Canales de log' },
  ];

  return (
    <main className="content">
      <PageHead title={overview.name} description="Estado del servidor y accesos directos a cada sección de configuración." />

      <div className="metrics">
        <div className="metric">
          <div className="k"><Users size={14} aria-hidden="true" /> Miembros</div>
          <div className="v">{overview.memberCount != null ? overview.memberCount.toLocaleString('es') : '—'}</div>
        </div>
        <div className="metric">
          <div className="k"><Hash size={14} aria-hidden="true" /> Canales</div>
          <div className="v">{overview.channelCount}</div>
        </div>
        <div className="metric">
          <div className="k"><ShieldUser size={14} aria-hidden="true" /> Roles</div>
          <div className="v">{overview.roleCount}</div>
        </div>
        <div className="metric">
          <div className="k"><TriangleAlert size={14} aria-hidden="true" /> Infracciones 30d</div>
          <div className="v">{overview.warnsLast30d != null ? overview.warnsLast30d : '—'}</div>
          <div className="sub">quedan en /warnings</div>
        </div>
      </div>

      <section className="panel" aria-label="Protecciones">
        <div className="panel-head">
          <div>
            <h2 className="panel-title">Protecciones</h2>
            <p className="panel-desc">Las tres que arruinan un servidor: vigiladas y aplicadas.</p>
          </div>
        </div>
        <div className="panel-body">
          {protectionItems.map(({ href, icon: Icon, name, desc, on, onText, offText }) => (
            <Link key={href} href={`/dashboard/${id}${href}`} className="protect-row">
              <span className={`row-icon${on ? ' on' : ''}`}><Icon size={17} aria-hidden="true" /></span>
              <span className="row-main">
                <span className="row-name">{name}</span>
                <span className="row-desc">{desc}</span>
              </span>
              <span className="row-side">
                <StatusPill state={on ? 'ok' : 'off'} okText={onText} offText={offText} />
                <ChevronRight size={16} className="muted" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-block" aria-label="Secciones">
        <h2>Configurar</h2>
        <div className="quick-grid">
          {quickLinks.map(({ href, icon: Icon, label, desc }) => (
            <Link key={href} href={`/dashboard/${id}${href}`} className="quick-card" aria-label={`Ir a ${label}`}>
              <Icon size={19} aria-hidden="true" />
              <span className="quick-name">{label}</span>
              <span className="quick-desc">{desc}</span>
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
