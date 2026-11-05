import { cache } from 'react';
import { getSession } from './auth';
import { fetchUserGuilds, hasAdminAccess, type DiscordGuild } from './discord';
import { botGet, BotApiError, type BotGuildsResponse } from './bot';

export type AdministeredGuild = DiscordGuild & { botPresent: boolean };

export type AdminGuildsResult =
  | { status: 'ok'; guilds: AdministeredGuild[] }
  | { status: 'unauthenticated' }
  | { status: 'bot-offline' };

/**
 * Servidores donde el usuario tiene permiso de administración Y el bot está
 * presente. Cacheado por request (React cache) para no repetir la llamada a
 * Discord + al bot en cada componente de la misma página.
 */
export const getAdministeredGuilds = cache(async (): Promise<AdminGuildsResult> => {
  const session = await getSession();
  if (!session) return { status: 'unauthenticated' };

  let discordGuilds: DiscordGuild[];
  try {
    discordGuilds = await fetchUserGuilds(session.accessToken);
  } catch {
    return { status: 'unauthenticated' };
  }

  const adminGuilds = discordGuilds.filter(hasAdminAccess);

  let botGuildIds: Set<string>;
  try {
    const res = await botGet<BotGuildsResponse>('/guilds');
    botGuildIds = new Set((res.guilds || []).map((g) => g.id));
  } catch (err) {
    if (err instanceof BotApiError && err.status === 401) {
      // La key no matchea: es un error de configuración, no "bot caído".
      throw new Error('BOT_API_KEY no coincide con la ADMIN_API_KEY configurada en el bot.');
    }
    return { status: 'bot-offline' };
  }

  const guilds = adminGuilds
    .map((g) => ({ ...g, botPresent: botGuildIds.has(g.id) }))
    .sort((a, b) => Number(b.botPresent) - Number(a.botPresent) || a.name.localeCompare(b.name));

  return { status: 'ok', guilds };
});

export const getAdministeredGuild = cache(async (id: string) => {
  const result = await getAdministeredGuilds();
  if (result.status !== 'ok') return result;
  const guild = result.guilds.find((g) => g.id === id) ?? null;
  return guild ? { status: 'ok' as const, guild } : { status: 'not-found' as const };
});
