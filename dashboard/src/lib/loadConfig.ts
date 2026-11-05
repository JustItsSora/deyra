import { cache } from 'react';
import { botGet, BotApiError } from './bot';
import type { BundleConfig, BotChannel, BotRole } from './types';

export const getBundleConfig = cache(async (guildId: string): Promise<BundleConfig | null> => {
  try {
    return await botGet<BundleConfig>(`/guilds/${guildId}/config`);
  } catch (err) {
    if (err instanceof BotApiError) return null;
    return null;
  }
});

export const getChannels = cache(async (guildId: string): Promise<BotChannel[]> => {
  try {
    const res = await botGet<{ channels: BotChannel[] }>(`/guilds/${guildId}/channels`);
    return res.channels ?? [];
  } catch {
    return [];
  }
});

export const getRoles = cache(async (guildId: string): Promise<BotRole[]> => {
  try {
    const res = await botGet<{ roles: BotRole[] }>(`/guilds/${guildId}/roles`);
    return res.roles ?? [];
  } catch {
    return [];
  }
});
