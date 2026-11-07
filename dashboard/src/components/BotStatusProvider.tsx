'use client';

import { createContext, useContext } from 'react';

export type BotStatus = 'online' | 'offline';

const BotStatusContext = createContext<BotStatus | null>(null);

export function BotStatusProvider({ status, children }: { status: BotStatus | null; children: React.ReactNode }) {
  return <BotStatusContext.Provider value={status}>{children}</BotStatusContext.Provider>;
}

export function useBotStatus(): BotStatus | null {
  return useContext(BotStatusContext);
}
