import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ShieldCheck, Radar, Zap, ChevronRight, Users, Hash, ShieldUser, TriangleAlert,
  Settings2, DoorOpen, ScrollText, Rocket,
} from 'lucide-react';
import { botGet, BotApiError } from '@/lib/bot';
import AccessNotice from '@/components/AccessNotice';
import StatusPill from '@/components/StatusPill';

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
    { href: '/bienvenida', icon: DoorOpen, label: 'Bienvenida', desc: 'Mensajes y tarjetas' },
    { href: '/registros', icon: ScrollText, label: 'Registros', desc: 'Canales de log' },
  ];

  return (
    <main className="content">
      <div className="page-head">
        <h1>{overview.name}</h1>
        <p>Estado del servidor y accesos directos a cada sección de configuración.</p>
      </div>

      <div className="stat-grid">
        <div className="stat"><div className="k"><Users size={13} aria-hidden="true" style={{ verticalAlign: -2 }} /> Miembros</div><div className="v">{overview.memberCount?.toLocaleString('es') ?? '—'}</div></div>
        <div className="stat"><div className="k"><Hash size={13} aria-hidden="true" style={{ verticalAlign: -2 }} /> Canales</div><div className="v">{overview.channelCount}</div></div>
        <div className="stat"><div className="k"><ShieldUser size={13} aria-hidden="true" style={{ verticalAlign: -2 }} /> Roles</div><div className="v">{overview.roleCount}</div></div>
        <div className="stat"><div className="k"><TriangleAlert size={13} aria-hidden="true" style={{ verticalAlign: -2 }} /> Infracciones 30d</div><div className="v">{overview.warnsLast30d ?? '—'}</div><div className="sub">quedan en /warnings</div></div>
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
