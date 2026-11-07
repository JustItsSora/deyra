'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChevronDown, LayoutDashboard, Settings2, ShieldCheck, Radar, Zap,
  DoorOpen, ScrollText, LogOut, UserRound, Plus, Check, Ticket, TrendingUp,
  UserRoundPlus, Music,
} from 'lucide-react';
import GuildIcon from './GuildIcon';
import SoundToggle from './SoundToggle';

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
  userAvatarUrl?: string | null;
};

// Secciones agrupadas; las rutas no cambian.
const NAV_GROUPS: Array<{ title: string; items: Array<{ href: string; label: string; icon: typeof LayoutDashboard }> }> = [
  {
    title: 'Principal',
    items: [
      { href: '', label: 'Resumen', icon: LayoutDashboard },
      { href: '/general', label: 'General', icon: Settings2 },
    ],
  },
  {
    title: 'Seguridad',
    items: [
      { href: '/automod', label: 'Automod', icon: ShieldCheck },
      { href: '/honeypot', label: 'Honeypot', icon: Radar },
      { href: '/seguridad', label: 'Anti-nuke', icon: Zap },
    ],
  },
  {
    title: 'Comunidad',
    items: [
      { href: '/bienvenida', label: 'Bienvenidas', icon: DoorOpen },
      { href: '/autorole', label: 'Autorole', icon: UserRoundPlus },
      { href: '/niveles', label: 'Niveles', icon: TrendingUp },
      { href: '/tickets', label: 'Tickets', icon: Ticket },
    ],
  },
  {
    title: 'Utilidades',
    items: [
      { href: '/musica', label: 'Música', icon: Music },
      { href: '/registros', label: 'Registros', icon: ScrollText },
    ],
  },
];

export default function Sidebar({ guilds, currentGuildId, userName, userAvatarUrl }: SidebarProps) {
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="brand-logo" src="/logo.png" alt="" width={26} height={26} />
          <span className="brand-word">Deyra</span>
        </Link>
        <div className="side-actions">
          <SoundToggle />
        </div>
      </div>

      <div className="switcher" ref={rootRef}>
        <button
          type="button"
          className="switcher-btn"
          aria-expanded={open}
          aria-haspopup="listbox"
          onClick={() => setOpen((v) => !v)}
        >
          <GuildIcon name={current.name} iconUrl={current.iconUrl} size={30} />
          <span className="switcher-meta">
            <span className="switcher-name">{current.name}</span>
            <span className="switcher-hint">Cambiar servidor</span>
          </span>
          <ChevronDown className="switcher-chev" size={16} aria-hidden="true" />
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
                  <span className="switcher-name">{g.name}</span>
                  {g.id === current.id && <Check size={16} className="check" aria-hidden="true" />}
                </button>
              ) : (
                <a
                  key={g.id}
                  className="listbox-opt"
                  href={g.inviteUrl ?? '#'}
                  target="_blank"
                  rel="noreferrer"
                  title="Añade a Deyra para configurarlo"
                >
                  <GuildIcon name={g.name} iconUrl={g.iconUrl} size={26} />
                  <span className="switcher-name">{g.name}</span>
                  <span className="pill warn push"><Plus size={12} aria-hidden="true" />Invitar</span>
                </a>
              ),
            )}
          </div>
        )}
      </div>

      <nav className="side-nav" aria-label="Secciones de configuración">
        {NAV_GROUPS.map((group) => (
          <div className="nav-group" key={group.title}>
            <span className="nav-group-title">{group.title}</span>
            {group.items.map(({ href, label, icon: Icon }) => {
              const path = `${base}${href}`;
              const active = pathname === path || (href === '' && pathname === base);
              return (
                <Link key={href || 'overview'} href={path} className="side-link" aria-current={active ? 'page' : undefined}>
                  <Icon size={17} aria-hidden="true" />
                  {label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="side-foot">
        <div className="side-user">
          {userAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={userAvatarUrl} alt="" width={24} height={24} className="side-user-avatar" />
          ) : (
            <UserRound size={18} aria-hidden="true" />
          )}
          <span className="side-user-name">{userName}</span>
        </div>
        <a href="/api/auth/logout" className="side-logout" aria-label="Cerrar sesión" title="Cerrar sesión">
          <LogOut size={15} aria-hidden="true" />
          Salir
        </a>
      </div>
    </aside>
  );
}
