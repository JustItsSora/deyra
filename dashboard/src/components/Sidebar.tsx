'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChevronDown, LayoutDashboard, Settings2, ShieldCheck, Radar, Zap,
  DoorOpen, ScrollText, LogOut, UserRound, Plus, Check, Ticket, TrendingUp,
  UserRoundPlus, Music,
} from 'lucide-react';
import ThemeSwitcher from './ThemeSwitcher';
import GuildIcon from './GuildIcon';

export type SidebarGuild = {
  id: string;
  name: string;
  iconUrl: string | null;
  botPresent: boolean;
  inviteUrl: string | null;
};

type SidebarProps = {
  guilds: SidebarGuild[];
  currentGuildId: string;
  userName: string;
};

const NAV_ITEMS = [
  { href: '', label: 'Resumen', icon: LayoutDashboard },
  { href: '/general', label: 'General', icon: Settings2 },
  { href: '/automod', label: 'Automod', icon: ShieldCheck },
  { href: '/honeypot', label: 'Honeypot', icon: Radar },
  { href: '/seguridad', label: 'Anti-nuke', icon: Zap },
  { href: '/tickets', label: 'Tickets', icon: Ticket },
  { href: '/niveles', label: 'Niveles', icon: TrendingUp },
  { href: '/autorole', label: 'Autorole', icon: UserRoundPlus },
  { href: '/musica', label: 'Música', icon: Music },
  { href: '/bienvenida', label: 'Bienvenidas', icon: DoorOpen },
  { href: '/registros', label: 'Registros', icon: ScrollText },
];

export default function Sidebar({ guilds, currentGuildId, userName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const current = guilds.find((g) => g.id === currentGuildId) ?? guilds[0];
  const base = `/dashboard/${current?.id ?? currentGuildId}`;

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  if (!current) return null;

  return (
    <aside className="sidebar">
      <div className="side-top">
        <Link href="/dashboard" className="brand" aria-label="Deyra — panel principal">
          <img className="brand-logo" src="/logo.png" alt="" width={32} height={32} />
          <span className="brand-word">Deyra</span>
        </Link>
        <a href="/api/auth/logout" className="side-link" style={{ padding: 8 }} aria-label="Cerrar sesión" title="Cerrar sesión">
          <LogOut size={18} aria-hidden="true" />
        </a>
      </div>

      <div className="switcher" ref={rootRef}>
        <button type="button" className="switcher-btn" aria-expanded={open} aria-haspopup="listbox" onClick={() => setOpen((v) => !v)}>
          <GuildIcon name={current.name} iconUrl={current.iconUrl} size={34} />
          <span style={{ minWidth: 0, textAlign: 'left' }}>
            <span style={{ display: 'block', fontWeight: 650, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{current.name}</span>
            <span className="muted" style={{ fontSize: 11 }}>Cambiar servidor</span>
          </span>
          <ChevronDown size={16} aria-hidden="true" style={{ marginLeft: 'auto', color: 'var(--muted)', flexShrink: 0 }} />
        </button>

        {open && (
          <div className="switcher-pop" role="listbox" aria-label="Servidores disponibles">
            {guilds.map((g) =>
              g.botPresent ? (
                <button
                  key={g.id}
                  type="button"
                  role="option"
                  aria-selected={g.id === current.id}
                  className="listbox-opt"
                  onClick={() => router.push(`/dashboard/${g.id}`)}
                >
                  <GuildIcon name={g.name} iconUrl={g.iconUrl} size={26} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</span>
                  {g.id === current.id && <Check size={16} className="check" style={{ opacity: 1 }} aria-hidden="true" />}
                </button>
              ) : (
                <a
                  key={g.id}
                  className="listbox-opt"
                  href={g.inviteUrl ?? '#'}
                  target="_blank"
                  rel="noreferrer"
                  title="Añade a Deyra para configurarlo"
                  style={{ textDecoration: 'none' }}
                >
                  <GuildIcon name={g.name} iconUrl={g.iconUrl} size={26} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</span>
                  <span className="pill warn" style={{ marginLeft: 'auto' }}><Plus size={12} aria-hidden="true" />Invitar</span>
                </a>
              ),
            )}
          </div>
        )}
      </div>

      <nav className="side-nav" aria-label="Secciones de configuración">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const path = `${base}${href}`;
          const active = pathname === path || (href === '' && pathname === base);
          return (
            <Link key={href || 'overview'} href={path} className="side-link" aria-current={active ? 'page' : undefined}>
              <Icon size={17} aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>

      <ThemeSwitcher />
      <div className="side-top" style={{ marginTop: 'auto', justifyContent: 'flex-start', padding: '8px 4px 0', borderTop: '1px solid var(--border)' }}>
        <UserRound size={18} aria-hidden="true" style={{ color: 'var(--muted)' }} />
        <span className="small muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</span>
      </div>
    </aside>
  );
}
