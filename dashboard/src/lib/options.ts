import type { ListboxOption } from '@/components/Listbox';
import type { BotChannel, BotRole } from './types';

export const NO_CHANNEL = '';

// Tipos de canal de Discord usados en el panel.
export const CHANNEL_TYPES = {
  text: [0, 5, 15], // GuildText, GuildAnnouncement, GuildForum
  voice: [2, 13], // GuildVoice, GuildStageVoice
  category: [4], // GuildCategory
} as const;

export function textChannelOptions(channels: BotChannel[], includeNone = true): ListboxOption[] {
  const opts = channels.filter((c) => (CHANNEL_TYPES.text as readonly number[]).includes(c.type)).map((c) => ({ value: c.id, label: `#${c.name}` }));
  return includeNone ? [{ value: NO_CHANNEL, label: 'Sin canal' }, ...opts] : opts;
}

export function voiceChannelOptions(channels: BotChannel[], includeNone = true): ListboxOption[] {
  const opts = channels.filter((c) => (CHANNEL_TYPES.voice as readonly number[]).includes(c.type)).map((c) => ({ value: c.id, label: c.name }));
  return includeNone ? [{ value: NO_CHANNEL, label: 'Sin canal de voz' }, ...opts] : opts;
}

export function categoryOptions(channels: BotChannel[], includeNone = true): ListboxOption[] {
  const opts = channels.filter((c) => (CHANNEL_TYPES.category as readonly number[]).includes(c.type)).map((c) => ({ value: c.id, label: c.name }));
  return includeNone ? [{ value: NO_CHANNEL, label: 'Sin categoría' }, ...opts] : opts;
}

export function channelOptions(channels: BotChannel[], includeNone = true): ListboxOption[] {
  const opts = channels.filter((c) => (CHANNEL_TYPES.text as readonly number[]).includes(c.type)).map((c) => ({ value: c.id, label: `#${c.name}` }));
  return includeNone ? [{ value: NO_CHANNEL, label: 'Sin canal' }, ...opts] : opts;
}

export function roleOptions(roles: BotRole[], includeNone = true): ListboxOption[] {
  const opts = roles
    .filter((r) => !r.managed && !r.isEveryone)
    .map((r) => ({ value: r.id, label: `@${r.name}` }));
  return includeNone ? [{ value: NO_CHANNEL, label: 'Sin rol' }, ...opts] : opts;
}
