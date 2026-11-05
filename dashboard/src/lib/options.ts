import type { ListboxOption } from '@/components/Listbox';
import type { BotChannel, BotRole } from './types';

export const NO_CHANNEL = '';

export function channelOptions(channels: BotChannel[], includeNone = true): ListboxOption[] {
  const opts = channels.map((c) => ({ value: c.id, label: `#${c.name}` }));
  return includeNone ? [{ value: NO_CHANNEL, label: 'Sin canal' }, ...opts] : opts;
}

export function roleOptions(roles: BotRole[], includeNone = true): ListboxOption[] {
  const opts = roles
    .filter((r) => !r.managed && !r.isEveryone)
    .map((r) => ({ value: r.id, label: `@${r.name}` }));
  return includeNone ? [{ value: NO_CHANNEL, label: 'Sin rol' }, ...opts] : opts;
}
