import { notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getAdministeredGuilds } from '@/lib/guilds';
import { inviteUrl, guildIconUrl } from '@/lib/discord';
import Sidebar, { type SidebarGuild } from '@/components/Sidebar';
import AccessNotice from '@/components/AccessNotice';

export const dynamic = 'force-dynamic';

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export default async function GuildLayout({ children, params }: LayoutProps) {
  const { id } = await params;
  if (!/^\d{17,20}$/.test(id)) notFound();

  const [session, result] = await Promise.all([getSession(), getAdministeredGuilds()]);

  if (result.status === 'bot-offline') {
    return <AccessNotice kind="bot-offline" />;
  }

  const administered = result.status === 'ok' ? result.guilds : [];
  const guild = administered.find((g) => g.id === id);

  // El usuario puede tener permisos pero el bot no está, o ni permisos ni bot.
  if (!guild) {
    return <AccessNotice kind="not-found" guildId={id} />;
  }
  if (!guild.botPresent) {
    return <AccessNotice kind="not-found" guildId={id} />;
  }

  const sidebarGuilds: SidebarGuild[] = administered.map((g) => ({
    id: g.id,
    name: g.name,
    iconUrl: guildIconUrl(g),
    botPresent: g.botPresent,
    inviteUrl: inviteUrl(g.id),
  }));

  return (
    <div className="shell">
      <Sidebar guilds={sidebarGuilds} currentGuildId={id} userName={session?.username ?? 'tú'} />
      {children}
    </div>
  );
}
