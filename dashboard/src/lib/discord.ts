export type DiscordUser = {
  id: string;
  username: string;
  global_name?: string | null;
  avatar: string | null;
};

export type DiscordGuild = {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
};

export function loginUrl(state: string): string {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    throw new Error('Faltan DISCORD_CLIENT_ID o DISCORD_REDIRECT_URI en el entorno.');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify guilds',
    state,
    prompt: 'none',
  });
  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

export async function exchangeCode(code: string): Promise<{ access_token: string }> {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Faltan DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET o DISCORD_REDIRECT_URI.');
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  });

  const res = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Discord rechazó el intercambio de code (${res.status}): ${text.slice(0, 200)}`);
  }
  return (await res.json()) as { access_token: string };
}

export async function fetchUser(accessToken: string): Promise<DiscordUser> {
  const res = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`No se pudo leer el usuario de Discord (${res.status}).`);
  return (await res.json()) as DiscordUser;
}

export async function fetchUserGuilds(accessToken: string): Promise<DiscordGuild[]> {
  const res = await fetch('https://discord.com/api/users/@me/guilds?limit=200', {
    headers: { Authorization: `Bearer ${accessToken}` },
    // Cambian poco; cache corta para que el alta/baja del bot no tarde en verse.
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`No se pudieron leer tus servidores (${res.status}).`);
  return (await res.json()) as DiscordGuild[];
}

const ADMIN_BIT = 0x8n;
const MANAGE_GUILD_BIT = 0x20n;

export function hasAdminAccess(guild: Pick<DiscordGuild, 'owner' | 'permissions'>): boolean {
  if (guild.owner) return true;
  try {
    const perms = BigInt(guild.permissions || '0');
    return (perms & ADMIN_BIT) === ADMIN_BIT || (perms & MANAGE_GUILD_BIT) === MANAGE_GUILD_BIT;
  } catch {
    return false;
  }
}

export function guildIconUrl(guild: Pick<DiscordGuild, 'id' | 'icon'>, size: 64 | 128 = 128): string | null {
  if (!guild.icon) return null;
  return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=${size}`;
}

/** Invite estándar del bot (scope bot + applications.commands, permisos de administrador). */
export function inviteUrl(guildId?: string): string | null {
  const clientId = process.env.DISCORD_CLIENT_ID;
  if (!clientId) return null;
  const params = new URLSearchParams({ client_id: clientId, permissions: '8', scope: 'bot applications.commands' });
  if (guildId) params.set('guild_id', guildId);
  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}
