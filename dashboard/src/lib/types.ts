export type GuildSection = {
  prefix: string | null;
  language: string;
  nsfw: boolean;
  modLogChannelId: string | null;
  memberLogChannelId: string | null;
  messageLogChannelId: string | null;
  muteRoleId: string | null;
  suggestionsChannelId: string | null;
  confessionsChannelId: string | null;
  birthdayChannelId: string | null;
};

export type AutomodSection = {
  enabled: boolean;
  antiInvite: boolean;
  antiLink: boolean;
  antiSpam: boolean;
  antiMention: boolean;
  antiCaps: boolean;
  antiBadWords: boolean;
  aiModeration: boolean;
  maxMentions: number;
  spamMessageCount: number;
  spamIntervalSeconds: number;
  capsPercentThreshold: number;
  punishmentAction: 'delete' | 'warn' | 'mute' | 'kick' | 'ban';
  escalationAction: 'off' | 'timeout' | 'kick' | 'ban';
  escalationThreshold: number;
  badWordsList: string[];
  whitelistedChannels: string[];
  whitelistedRoles: string[];
  linkAllowlist: string[];
  logChannelId: string | null;
};

export type HoneypotSection = {
  enabled: boolean;
  channelId: string | null;
  action: 'timeout' | 'kick' | 'ban';
  timeoutMinutes: number;
};

export type AntiNukeSection = {
  enabled: boolean;
  action: 'ban' | 'derank' | 'log';
  threshold: number;
  windowMinutes: number;
  whitelistedUsers: string[];
  whitelistedRoles: string[];
};

export type WelcomeSection = {
  welcomeEnabled: boolean;
  welcomeChannelId: string | null;
  welcomeMessage: string;
  welcomeCardEnabled: boolean;
  leaveEnabled: boolean;
  leaveChannelId: string | null;
  leaveMessage: string;
};

export type BundleConfig = {
  guild: GuildSection;
  automod: AutomodSection;
  honeypot: HoneypotSection;
  antinuke: AntiNukeSection;
  welcome: WelcomeSection;
};

export type BotChannel = { id: string; name: string; type: number; parentId: string | null };
export type BotRole = { id: string; name: string; color: string; position: number; managed: boolean; isEveryone: boolean };
