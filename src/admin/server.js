// src/admin/server.js
// API admin embebida en el bot para el dashboard web (Next.js en Vercel).
//
// Por qué existe: Vercel es serverless y efímero; la "verdad" de la
// configuración de un servidor vive en la DB SQLite de este proceso. El panel
// web no puede leer/escribir el archivo por su cuenta, así que el bot expone
// esta API y el panel habla con ella vía HTTPS.
//
// Seguridad (fail-closed):
//   · sin ADMIN_API_KEY el módulo ni siquiera abre el puerto
//   · Bearer token con comparación en tiempo constante
//   · CORS restringido a DASHBOARD_ORIGIN (si no se define, sin CORS)
//   · rate limit por IP (60 req / 5 min)
//   · body JSON con tope de 64 KB
//   · whitelist estricta de campos por endpoint; claves desconocidas → 400
//   · el bot nunca actúa fuera de los guilds donde está presente
//
// Variables de entorno: ADMIN_API_KEY, ADMIN_PORT (SERVER_PORT tiene
// prioridad en bot-hosting.net), DASHBOARD_ORIGIN.

const { ChannelType, PermissionsBitField } = require('discord.js');

const http = require('http');
const crypto = require('crypto');
const config = require('../config');
const { GuildConfig, AutomodConfig, HoneypotConfig, AntiNukeConfig, WelcomeConfig, Warn, LevelConfig, TicketConfig, MusicConfig, AutoRole } = require('../data/models');
const { ensureHoneypotChannel } = require('../lib/honeypot');
const { getMusicConfig, invalidateMusicConfig, applySettingsToPlayer } = require('../music/lib/musicConfig');

const MAX_BODY = 64 * 1024;
const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 5 * 60 * 1000;

// JSON.parse sobre columnas TEXT con datos potencialmente corruptos: un solo
// archivo dañado no debe convertir toda la sección en un 500.
function parseJsonArray(raw, fallback = []) {
    try {
        const v = JSON.parse(raw || '[]');
        return Array.isArray(v) ? v : fallback;
    } catch {
        return fallback;
    }
}

function parseJsonObject(raw, fallback = {}) {
    try {
        const v = JSON.parse(raw || '{}');
        return v && typeof v === 'object' && !Array.isArray(v) ? v : fallback;
    } catch {
        return fallback;
    }
}

const rateBuckets = new Map(); // ip -> { count, resetAt }

function timingSafeEqualString(a, b) {
    const ba = Buffer.from(String(a));
    const bb = Buffer.from(String(b));
    if (ba.length !== bb.length) return false;
    return crypto.timingSafeEqual(ba, bb);
}

function clientIp(req) {
    const fwd = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    return fwd || req.socket.remoteAddress || 'unknown';
}

function rateLimited(ip) {
    const now = Date.now();
    let bucket = rateBuckets.get(ip);
    if (!bucket || now > bucket.resetAt) {
        bucket = { count: 0, resetAt: now + RATE_WINDOW_MS };
        rateBuckets.set(ip, bucket);
    }
    bucket.count += 1;
    if (rateBuckets.size > 5000) {
        for (const [key, b] of rateBuckets) {
            if (now > b.resetAt) rateBuckets.delete(key);
        }
    }
    return bucket.count > RATE_LIMIT;
}

function sendJson(res, status, body, origin) {
    const payload = JSON.stringify(body);
    const headers = {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(payload),
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
    };
    if (origin) {
        headers['Access-Control-Allow-Origin'] = origin;
        headers['Vary'] = 'Origin';
    }
    res.writeHead(status, headers);
    res.end(payload);
}

function jsonError(res, status, code, message, origin) {
    sendJson(res, status, { error: code, message }, origin);
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        let size = 0;
        req.on('data', chunk => {
            size += chunk.length;
            if (size > MAX_BODY) {
                reject(Object.assign(new Error('body too large'), { code: 'BODY_TOO_LARGE' }));
                req.destroy();
                return;
            }
            chunks.push(chunk);
        });
        req.on('end', () => {
            if (chunks.length === 0) return resolve({});
            try {
                resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
            } catch {
                reject(Object.assign(new Error('invalid JSON'), { code: 'BAD_JSON' }));
            }
        });
        req.on('error', reject);
    });
}

// ── Validadores ───────────────────────────────────────────────────────────

const isSnowflake = (v) => typeof v === 'string' && /^\d{17,20}$/.test(v);
const boolRule = (v) => (typeof v === 'boolean' ? v : undefined);
const asInt = (v, min, max) => {
    const n = Number(v);
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < min || n > max) return null;
    return n;
};
const asString = (v, maxLen) => (typeof v === 'string' ? v.trim().slice(0, maxLen) : null);
const asSnowflakeArray = (v, max = 200) => {
    if (!Array.isArray(v)) return null;
    const out = [];
    for (const item of v) {
        if (!isSnowflake(item)) return null;
        if (!out.includes(item)) out.push(item);
        if (out.length > max) return null;
    }
    return out;
};
const asStringArray = (v, maxItems = 200, maxLen = 64) => {
    if (!Array.isArray(v)) return null;
    const out = [];
    for (const item of v) {
        const s = asString(item, maxLen);
        if (!s) return null;
        if (!out.includes(s)) out.push(s);
        if (out.length > maxItems) return null;
    }
    return out;
};
const asDomainArray = (v, maxItems = 200) => {
    if (!Array.isArray(v)) return null;
    const out = [];
    for (const item of v) {
        const s = String(item || '').trim().toLowerCase().slice(0, 253);
        if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(s)) return null;
        if (!out.includes(s)) out.push(s);
        if (out.length > maxItems) return null;
    }
    return out;
};

/** Aplica `patch` validado sobre `model instance` solo con las claves permitidas. */
function applyPatch(instance, patch, rules) {
    const applied = [];
    for (const [key, rule] of Object.entries(rules)) {
        if (!(key in patch)) continue;
        const value = rule(patch[key]);
        if (value === undefined) return { error: key };
        instance[key] = value;
        applied.push(key);
    }
    return { applied };
}

const enumOf = (...allowed) => (v) => (allowed.includes(v) ? v : undefined);

// ── Serializadores ────────────────────────────────────────────────────────

function guildSummary(guild) {
    return {
        id: guild.id,
        name: guild.name,
        icon: guild.icon,
        memberCount: guild.memberCount ?? null,
        ownerId: guild.ownerId ?? null,
    };
}

function automodJson(cfg) {
    return {
        enabled: cfg?.enabled ?? false,
        antiInvite: cfg?.antiInvite ?? false,
        antiLink: cfg?.antiLink ?? false,
        antiSpam: cfg?.antiSpam ?? false,
        antiMention: cfg?.antiMention ?? false,
        antiCaps: cfg?.antiCaps ?? false,
        antiBadWords: cfg?.antiBadWords ?? false,
        aiModeration: cfg?.aiModeration ?? false,
        maxMentions: cfg?.maxMentions ?? 5,
        spamMessageCount: cfg?.spamMessageCount ?? 5,
        spamIntervalSeconds: cfg?.spamIntervalSeconds ?? 5,
        capsPercentThreshold: cfg?.capsPercentThreshold ?? 70,
        punishmentAction: cfg?.punishmentAction ?? 'delete',
        escalationAction: cfg?.escalationAction ?? 'off',
        escalationThreshold: cfg?.escalationThreshold ?? 5,
        badWordsList: parseJsonArray(cfg?.badWordsList),
        whitelistedChannels: parseJsonArray(cfg?.whitelistedChannels),
        whitelistedRoles: parseJsonArray(cfg?.whitelistedRoles),
        linkAllowlist: parseJsonArray(cfg?.linkAllowlist),
        logChannelId: cfg?.logChannelId ?? null,
    };
}

function honeypotJson(cfg) {
    const rotationMinutes = cfg?.rotationMinutes ?? ((cfg?.rotationHours ?? 0) * 60);
    return {
        enabled: cfg?.enabled ?? false,
        channelId: cfg?.channelId ?? null,
        action: cfg?.action ?? 'kick',
        timeoutMinutes: cfg?.timeoutMinutes ?? 1440,
        autoPurge: cfg?.autoPurge ?? false,
        rotationMinutes,
        rotationHours: Math.floor(rotationMinutes / 60), // compat: panel anterior
        caughtCount: cfg?.caughtCount ?? 0,
        lastRotationAt: (() => { const d = cfg?.lastRotationAt ? new Date(cfg.lastRotationAt) : null; return d && !Number.isNaN(d.getTime()) ? d.toISOString() : null; })(),
    };
}

function levelsJson(cfg) {
    const roleRewards = parseJsonObject(cfg?.roleRewards);
    return {
        enabled: cfg?.enabled ?? true,
        announceLevelUp: cfg?.announceLevelUp ?? true,
        announceChannelId: cfg?.announceChannelId ?? null,
        xpPerMessageMin: cfg?.xpPerMessageMin ?? 15,
        xpPerMessageMax: cfg?.xpPerMessageMax ?? 25,
        xpCooldownSeconds: cfg?.xpCooldownSeconds ?? 60,
        roleRewards,
        ignoredChannels: parseJsonArray(cfg?.ignoredChannels),
    };
}

function ticketsJson(cfg) {
    return {
        categoryId: cfg?.categoryId ?? null,
        panelChannelId: cfg?.panelChannelId ?? null,
        logChannelId: cfg?.logChannelId ?? null,
        supportRoleIds: parseJsonArray(cfg?.supportRoleIds),
        welcomeMessage: cfg?.welcomeMessage ?? null,
        panelTitle: cfg?.panelTitle ?? 'Soporte',
        panelDescription: cfg?.panelDescription ?? 'Haz clic en el botón de abajo para abrir un ticket.',
        ticketCounter: cfg?.ticketCounter ?? 0,
    };
}

function musicJson(cfg) {
    return {
        defaultVolume: cfg?.defaultVolume ?? 80,
        defaultAutoplay: cfg?.defaultAutoplay ?? false,
        defaultFairplay: cfg?.defaultFairplay ?? false,
        fairplayRoleId: cfg?.fairplayRoleId ?? null,
        twentyFourSeven: cfg?.twentyFourSeven ?? false,
        voice247Id: cfg?.voice247Id ?? null,
        text247Id: cfg?.text247Id ?? null,
        leaveOnEmptyMs: cfg?.leaveOnEmptyMs ?? 60000,
        leaveOnEndMs: cfg?.leaveOnEndMs ?? 120000,
        historyEnabled: cfg?.historyEnabled ?? true,
        nowPlayingPanel: cfg?.nowPlayingPanel ?? true,
        maxQueueSize: cfg?.maxQueueSize ?? 500,
    };
}

function autoroleJson(cfg) {
    return {
        roleIds: parseJsonArray(cfg?.roleIds),
        botRoleIds: parseJsonArray(cfg?.botRoleIds),
    };
}

function antinukeJson(cfg) {
    return {
        enabled: cfg?.enabled ?? false,
        action: cfg?.action ?? 'ban',
        threshold: cfg?.threshold ?? 3,
        windowMinutes: cfg?.windowMinutes ?? 10,
        whitelistedUsers: parseJsonArray(cfg?.whitelistedUsers),
        whitelistedRoles: parseJsonArray(cfg?.whitelistedRoles),
    };
}

function welcomeJson(cfg) {
    return {
        welcomeEnabled: cfg?.welcomeEnabled ?? false,
        welcomeChannelId: cfg?.welcomeChannelId ?? null,
        welcomeMessage: cfg?.welcomeMessage ?? '¡Bienvenido/a {user} a {server}! Ahora somos {membercount} miembros.',
        welcomeCardEnabled: cfg?.welcomeCardEnabled ?? true,
        leaveEnabled: cfg?.leaveEnabled ?? false,
        leaveChannelId: cfg?.leaveChannelId ?? null,
        leaveMessage: cfg?.leaveMessage ?? '{user} ha dejado el servidor. Éramos {membercount} miembros.',
    };
}

function guildJson(cfg) {
    return {
        prefix: cfg?.prefix ?? null,
        language: cfg?.language ?? 'es',
        timezone: cfg?.timezone ?? 'UTC',
        nsfw: cfg?.nsfw ?? false,
        modLogChannelId: cfg?.modLogChannelId ?? null,
        memberLogChannelId: cfg?.memberLogChannelId ?? null,
        messageLogChannelId: cfg?.messageLogChannelId ?? null,
        muteRoleId: cfg?.muteRoleId ?? null,
        suggestionsChannelId: cfg?.suggestionsChannelId ?? null,
        confessionsChannelId: cfg?.confessionsChannelId ?? null,
        birthdayChannelId: cfg?.birthdayChannelId ?? null,
    };
}

// ── Aplicación de patches ─────────────────────────────────────────────────

async function patchAutomod(guild, patch) {
    const guildId = guild.id;
    const allowed = ['enabled','antiInvite','antiLink','antiSpam','antiMention','antiCaps','antiBadWords','aiModeration','maxMentions','spamMessageCount','spamIntervalSeconds','capsPercentThreshold','punishmentAction','escalationAction','escalationThreshold','badWordsList','whitelistedChannels','whitelistedRoles','linkAllowlist','logChannelId'];
    for (const key of Object.keys(patch)) {
        if (!allowed.includes(key)) return { error: `unknown field: ${key}` };
    }
    const [cfg] = await AutomodConfig.findOrCreate({ where: { guildId }, defaults: { guildId } });

    const textChannelRule = (v) => {
        if (v === null || v === '') return null;
        if (!isSnowflake(v)) return undefined;
        const ch = guild.channels.cache.get(v);
        return ch && ch.isTextBased?.() ? v : undefined;
    };

    const rules = {
        enabled: boolRule, antiInvite: boolRule, antiLink: boolRule, antiSpam: boolRule,
        antiMention: boolRule, antiCaps: boolRule, antiBadWords: boolRule, aiModeration: boolRule,
        maxMentions: v => asInt(v, 1, 50) ?? undefined,
        spamMessageCount: v => asInt(v, 2, 30) ?? undefined,
        spamIntervalSeconds: v => asInt(v, 1, 120) ?? undefined,
        capsPercentThreshold: v => asInt(v, 1, 100) ?? undefined,
        escalationThreshold: v => asInt(v, 1, 100) ?? undefined,
        punishmentAction: enumOf('delete', 'warn', 'mute', 'kick', 'ban'),
        escalationAction: enumOf('off', 'timeout', 'kick', 'ban'),
        badWordsList: v => { const a = asStringArray(v, 500, 64); return a ? JSON.stringify(a.map(w => w.toLowerCase())) : undefined; },
        whitelistedChannels: v => { const a = asSnowflakeArray(v); return a ? JSON.stringify(a) : undefined; },
        whitelistedRoles: v => { const a = asSnowflakeArray(v); return a ? JSON.stringify(a) : undefined; },
        linkAllowlist: v => { const a = asDomainArray(v); return a ? JSON.stringify(a) : undefined; },
        logChannelId: textChannelRule,
    };

    const result = applyPatch(cfg, patch, rules);
    if (result.error) return { error: `invalid value for: ${result.error}` };
    await cfg.save();
    return { data: automodJson(cfg) };
}

async function patchHoneypot(guild, patch) {
    const allowed = ['enabled', 'channelId', 'action', 'timeoutMinutes', 'autoPurge', 'rotationMinutes', 'rotationHours'];
    for (const key of Object.keys(patch)) {
        if (!allowed.includes(key)) return { error: `unknown field: ${key}` };
    }
    // Compat con el panel anterior (pre-minutos): rotationHours → rotationMinutes.
    if (patch.rotationHours !== undefined) {
        if (patch.rotationMinutes !== undefined) return { error: 'rotationHours y rotationMinutes no se pueden usar juntos' };
        const h = asInt(patch.rotationHours, 0, 168);
        if (h === null) return { error: 'invalid value for: rotationHours' };
        const nextPatch = { ...patch, rotationMinutes: h * 60 };
        delete nextPatch.rotationHours;
        patch = nextPatch;
    }
    const [cfg] = await HoneypotConfig.findOrCreate({ where: { guildId: guild.id }, defaults: { guildId: guild.id } });
    const prevChannelId = cfg.channelId ?? null;

    const rules = {
        enabled: boolRule,
        action: enumOf('timeout', 'kick', 'ban'),
        timeoutMinutes: v => asInt(v, 1, 40320) ?? undefined,
        autoPurge: boolRule,
        rotationMinutes: v => asInt(v, 0, 10080) ?? undefined,
        channelId: v => {
            if (v === null) return null;
            if (!isSnowflake(v)) return undefined;
            const channel = guild.channels.cache.get(v);
            if (!channel || !(channel.isTextBased?.())) return undefined;
            return v;
        },
    };

    const result = applyPatch(cfg, patch, rules);
    if (result.error) return { error: `invalid value for: ${result.error}` };

    // Al activar y no tener canal (o tener uno ya borrado): crear uno propio
    // con nombre señuelo. Si el bot no puede crear canales, se reporta y no se
    // activa a medias.
    let createdChannel = null;
    if (cfg.enabled && cfg.channelId) {
        const stored = guild.channels.cache.get(cfg.channelId);
        if (!stored || !stored.isTextBased?.()) cfg.channelId = null;
    }
    if (cfg.enabled && !cfg.channelId) {
        try {
            const created = await ensureHoneypotChannel(guild);
            cfg.channelId = created.id;
            createdChannel = created.name;
        } catch (err) {
            console.error('[admin/honeypot] No se pudo auto-crear el canal:', err.message);
            return { error: 'el bot no pudo crear el canal señuelo (necesita Gestionar canales)' };
        }
    }

    await cfg.save();

    const assignedNew = createdChannel || (cfg.enabled && cfg.channelId && cfg.channelId !== prevChannelId);
    if (assignedNew) {
        try {
            const ch = guild.channels.cache.get(cfg.channelId);
            const { sendHoneypotWarning } = require('../lib/honeypot');
            await sendHoneypotWarning(ch, { guild, action: cfg.action, timeoutMinutes: cfg.timeoutMinutes });
        } catch (warnErr) {
            console.error('[admin/honeypot] No se pudo enviar el aviso del señuelo:', warnErr.message);
        }
    }

    require('../gateway/honeypot/honeypotEvents').invalidateCache(guild.id);
    return { data: { ...honeypotJson(cfg), createdChannel } };
}

async function patchAntiNuke(guild, patch) {
    const guildId = guild.id;
    const allowed = ['enabled', 'action', 'threshold', 'windowMinutes', 'whitelistedUsers', 'whitelistedRoles'];
    for (const key of Object.keys(patch)) {
        if (!allowed.includes(key)) return { error: `unknown field: ${key}` };
    }
    const [cfg] = await AntiNukeConfig.findOrCreate({ where: { guildId }, defaults: { guildId } });

    const rules = {
        enabled: boolRule,
        action: enumOf('ban', 'derank', 'log'),
        threshold: v => asInt(v, 1, 20) ?? undefined,
        windowMinutes: v => asInt(v, 1, 120) ?? undefined,
        whitelistedUsers: v => { const a = asSnowflakeArray(v); return a ? JSON.stringify(a) : undefined; },
        // Roles borrados se descartan en vez de dejar una lista blanca muerta.
        whitelistedRoles: v => {
            const a = asSnowflakeArray(v);
            if (!a) return undefined;
            return JSON.stringify(a.filter(id => guild.roles.cache.has(id)));
        },
    };

    const result = applyPatch(cfg, patch, rules);
    if (result.error) return { error: `invalid value for: ${result.error}` };
    await cfg.save();

    require('../gateway/antinuke/antinukeEvents').invalidateCache(guildId);
    return { data: antinukeJson(cfg) };
}

async function patchWelcome(guild, patch) {
    const allowed = ['welcomeEnabled', 'welcomeChannelId', 'welcomeMessage', 'welcomeCardEnabled', 'leaveEnabled', 'leaveChannelId', 'leaveMessage'];
    for (const key of Object.keys(patch)) {
        if (!allowed.includes(key)) return { error: `unknown field: ${key}` };
    }
    const [cfg] = await WelcomeConfig.findOrCreate({ where: { guildId: guild.id }, defaults: { guildId: guild.id } });

    const channelRule = (v) => {
        if (v === null) return null;
        if (!isSnowflake(v)) return undefined;
        const channel = guild.channels.cache.get(v);
        return channel && channel.isTextBased?.() ? v : undefined;
    };
    const rules = {
        welcomeEnabled: boolRule,
        welcomeCardEnabled: boolRule,
        leaveEnabled: boolRule,
        welcomeChannelId: channelRule,
        leaveChannelId: channelRule,
        welcomeMessage: v => (typeof v === 'string' && v.trim().length > 0 ? v.trim().slice(0, 500) : undefined),
        leaveMessage: v => (typeof v === 'string' && v.trim().length > 0 ? v.trim().slice(0, 500) : undefined),
    };

    const result = applyPatch(cfg, patch, rules);
    if (result.error) return { error: `invalid value for: ${result.error}` };
    await cfg.save();
    return { data: welcomeJson(cfg) };
}

function asSnowflakeMap(v, maxEntries = 100, maxLevel = 1000) {
    if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
    const entries = Object.entries(v);
    if (entries.length > maxEntries) return null;
    const out = {};
    for (const [levelKey, roleId] of entries) {
        const level = Number(levelKey);
        if (!Number.isInteger(level) || level < 1 || level > maxLevel) return null;
        if (!isSnowflake(roleId)) return null;
        out[String(level)] = roleId;
    }
    // Orden ascendente por nivel para estabilidad visual
    return Object.fromEntries(Object.entries(out).sort((a, b) => Number(a[0]) - Number(b[0])));
}

async function patchLevels(guild, patch) {
    const guildId = guild.id;
    const allowed = ['enabled', 'announceLevelUp', 'announceChannelId', 'xpPerMessageMin', 'xpPerMessageMax', 'xpCooldownSeconds', 'roleRewards', 'ignoredChannels'];
    for (const key of Object.keys(patch)) {
        if (!allowed.includes(key)) return { error: `unknown field: ${key}` };
    }
    const [cfg] = await LevelConfig.findOrCreate({ where: { guildId }, defaults: { guildId } });

    const channelRule = (v) => {
        if (v === null || v === '') return null;
        if (!isSnowflake(v)) return undefined;
        const ch = guild.channels.cache.get(v);
        return ch && ch.isTextBased?.() ? v : undefined;
    };
    const rules = {
        enabled: boolRule,
        announceLevelUp: boolRule,
        announceChannelId: channelRule,
        xpPerMessageMin: v => asInt(v, 1, 200) ?? undefined,
        xpPerMessageMax: v => asInt(v, 1, 200) ?? undefined,
        xpCooldownSeconds: v => asInt(v, 0, 3600) ?? undefined,
        roleRewards: v => { const m = asSnowflakeMap(v); return m ? JSON.stringify(m) : undefined; },
        ignoredChannels: v => { const a = asSnowflakeArray(v); return a ? JSON.stringify(a) : undefined; },
    };

    const result = applyPatch(cfg, patch, rules);
    if (result.error) return { error: `invalid value for: ${result.error}` };
    if (cfg.xpPerMessageMin > cfg.xpPerMessageMax) {
        return { error: 'xpPerMessageMin no puede ser mayor que xpPerMessageMax' };
    }
    await cfg.save();
    return { data: levelsJson(cfg) };
}

async function patchTickets(guild, patch) {
    const allowed = ['categoryId', 'panelChannelId', 'logChannelId', 'supportRoleIds', 'welcomeMessage', 'panelTitle', 'panelDescription'];
    for (const key of Object.keys(patch)) {
        if (!allowed.includes(key)) return { error: `unknown field: ${key}` };
    }
    const [cfg] = await TicketConfig.findOrCreate({ where: { guildId: guild.id }, defaults: { guildId: guild.id } });

    const guildChannel = (id) => guild.channels.cache.get(id) || null;
    const categoryRule = (v) => {
        if (v === null || v === '') return null;
        if (!isSnowflake(v)) return undefined;
        const ch = guildChannel(v);
        return ch && ch.type === ChannelType.GuildCategory ? v : undefined;
    };
    const textChannelRule = (v) => {
        if (v === null || v === '') return null;
        if (!isSnowflake(v)) return undefined;
        const ch = guildChannel(v);
        return ch && ch.isTextBased?.() ? v : undefined;
    };

    const rules = {
        categoryId: categoryRule,
        panelChannelId: textChannelRule,
        logChannelId: textChannelRule,
        supportRoleIds: v => {
            const a = asSnowflakeArray(v, 20);
            if (!a) return undefined;
            return JSON.stringify(a.filter(id => guild.roles.cache.has(id)));
        },
        welcomeMessage: v => (v === null ? null : (typeof v === 'string' && v.trim().length <= 500 ? (v.trim() || null) : undefined)),
        panelTitle: v => (typeof v === 'string' && v.trim().length >= 1 && v.trim().length <= 80 ? v.trim() : undefined),
        panelDescription: v => (typeof v === 'string' && v.trim().length >= 1 && v.trim().length <= 200 ? v.trim() : undefined),
    };

    const result = applyPatch(cfg, patch, rules);
    if (result.error) return { error: `invalid value for: ${result.error}` };
    await cfg.save();
    return { data: ticketsJson(cfg) };
}

async function patchMusic(guild, patch) {
    const allowed = ['defaultVolume', 'defaultAutoplay', 'defaultFairplay', 'fairplayRoleId', 'twentyFourSeven', 'voice247Id', 'text247Id', 'leaveOnEmptyMs', 'leaveOnEndMs', 'historyEnabled', 'nowPlayingPanel', 'maxQueueSize'];
    for (const key of Object.keys(patch)) {
        if (!allowed.includes(key)) return { error: `unknown field: ${key}` };
    }
    const [cfg] = await MusicConfig.findOrCreate({ where: { guildId: guild.id }, defaults: { guildId: guild.id } });

    const voiceRule = (v) => {
        if (v === null || v === '') return null;
        if (!isSnowflake(v)) return undefined;
        const ch = guild.channels.cache.get(v);
        const ok = ch && (ch.type === ChannelType.GuildVoice || ch.type === ChannelType.GuildStageVoice);
        return ok ? v : undefined;
    };
    const textRule = (v) => {
        if (v === null || v === '') return null;
        if (!isSnowflake(v)) return undefined;
        const ch = guild.channels.cache.get(v);
        return ch && ch.isTextBased?.() ? v : undefined;
    };
    const roleRule = (v) => {
        if (v === null || v === '') return null;
        if (!isSnowflake(v)) return undefined;
        return guild.roles.cache.has(v) ? v : undefined;
    };

    const rules = {
        defaultVolume: v => asInt(v, 0, 100) ?? undefined,
        defaultAutoplay: boolRule,
        defaultFairplay: boolRule,
        fairplayRoleId: roleRule,
        twentyFourSeven: boolRule,
        voice247Id: voiceRule,
        text247Id: textRule,
        leaveOnEmptyMs: v => asInt(v, 0, 3600000) ?? undefined,
        leaveOnEndMs: v => asInt(v, 0, 3600000) ?? undefined,
        historyEnabled: boolRule,
        nowPlayingPanel: boolRule,
        maxQueueSize: v => asInt(v, 1, 5000) ?? undefined,
    };

    const result = applyPatch(cfg, patch, rules);
    if (result.error) return { error: `invalid value for: ${result.error}` };

    // 24/7 sin un canal de voz válido no se puede cumplir: se rechaza en vez
    // de guardar un ajuste que el cron va a ignorar para siempre.
    if (cfg.twentyFourSeven) {
        const voice = cfg.voice247Id ? guild.channels.cache.get(cfg.voice247Id) : null;
        const usable = voice && (voice.type === ChannelType.GuildVoice || voice.type === ChannelType.GuildStageVoice);
        if (!usable) return { error: 'el modo 24/7 exige un canal de voz válido del servidor: elige uno en Música, o desactiva 24/7 para guardar este cambio' };
        const me = guild.members.me;
        const canConnect = !me || voice.permissionsFor(me)?.has(PermissionsBitField.Flags.Connect);
        if (!canConnect) return { error: 'el bot no puede entrar a ese canal de voz (falta el permiso Conectar)' };
    }

    await cfg.save();

    // El motor de música cachea los ajustes 60s: sin invalidar, el panel
    // mostraba "guardado" y el bot seguía con los valores viejos hasta un
    // minuto después. Además se aplica al player vivo (o se entra al canal si
    // el 24/7 se acaba de activar) para que el cambio se note al instante.
    invalidateMusicConfig(guild.id);
    const settings = await getMusicConfig(guild.id, { fresh: true });
    // No se espera al nodo de voz: el guardado ya está hecho y conectarse
    // puede tardar; si falla, el cron de 24/7 lo reintenta.
    applyMusicRuntime(guild, settings).catch((err) => {
        console.error('[admin/music] Error aplicando ajustes al runtime:', err.message);
    });

    return { data: musicJson(cfg) };
}

/**
 * Lleva los ajustes de música al runtime: si hay un player vivo le aplica el
 * cambio (y lo mueve si el 24/7 apunta a otro canal); si no hay player y el
 * 24/7 está activo, entra al canal elegido sin esperar al cron de 15 minutos.
 */
async function applyMusicRuntime(guild, settings) {
    const client = guild.client;
    if (!client?.music) return;

    const player = client.music.players?.get(guild.id);
    if (player && player.state !== 'DESTROYED') {
        let moved = false;
        if (settings.twentyFourSeven && settings.voice247Id
            && player.voiceId && player.voiceId !== settings.voice247Id) {
            try {
                player.setVoiceChannel(settings.voice247Id);
                moved = true;
            } catch (err) {
                console.error('[admin/music] No se pudo mover el player al canal 24/7:', err.message);
            }
        }
        applySettingsToPlayer(player, settings);
        // setVoiceChannel actualiza el canal de forma asíncrona; applySettings
        // puede haber visto todavía el canal viejo y haber dejado stay247 en
        // falso. Como el 24/7 sigue activo, se reafirma tras el movimiento.
        if (moved && settings.twentyFourSeven) player.data.set('stay247', true);
        return;
    }

    if (!settings.twentyFourSeven || !settings.voice247Id) return;

    try {
        const created = await client.music.createPlayer({
            guildId: guild.id,
            voiceId: settings.voice247Id,
            textId: settings.text247Id || undefined,
            volume: settings.defaultVolume,
            deaf: true,
        });
        applySettingsToPlayer(created, settings);
        created.data.set('stay247', true);
    } catch (err) {
        console.error('[admin/music] No se pudo entrar al canal 24/7:', err.message);
    }
}

async function patchAutorole(guild, patch) {
    const guildId = guild.id;
    const allowed = ['roleIds', 'botRoleIds'];
    for (const key of Object.keys(patch)) {
        if (!allowed.includes(key)) return { error: `unknown field: ${key}` };
    }
    const [cfg] = await AutoRole.findOrCreate({ where: { guildId }, defaults: { guildId } });

    // Roles borrados se descartan: asignar un rol inexistente falla en cada ingreso.
    const roleList = (v) => {
        const a = asSnowflakeArray(v, 20);
        if (!a) return undefined;
        return JSON.stringify(a.filter(id => guild.roles.cache.has(id)));
    };
    const rules = {
        roleIds: roleList,
        botRoleIds: roleList,
    };

    const result = applyPatch(cfg, patch, rules);
    if (result.error) return { error: `invalid value for: ${result.error}` };
    await cfg.save();
    return { data: autoroleJson(cfg) };
}

async function patchGuild(guild, patch) {
    const guildId = guild.id;
    const allowed = ['prefix', 'language', 'timezone', 'modLogChannelId', 'memberLogChannelId', 'messageLogChannelId', 'muteRoleId', 'suggestionsChannelId', 'confessionsChannelId', 'birthdayChannelId', 'nsfw'];
    for (const key of Object.keys(patch)) {
        if (!allowed.includes(key)) return { error: `unknown field: ${key}` };
    }
    const [cfg] = await GuildConfig.findOrCreate({ where: { guildId }, defaults: { guildId } });

    const textChannelRule = (v) => {
        if (v === null || v === '') return null;
        if (!isSnowflake(v)) return undefined;
        const ch = guild.channels.cache.get(v);
        return ch && ch.isTextBased?.() ? v : undefined;
    };
    const roleRule = (v) => {
        if (v === null || v === '') return null;
        if (!isSnowflake(v)) return undefined;
        return guild.roles.cache.has(v) ? v : undefined;
    };

    const rules = {
        prefix: v => (v === null ? null : (typeof v === 'string' && v.trim().length >= 1 && v.trim().length <= 5 ? v.trim() : undefined)),
        language: enumOf('es', 'en', 'en-US', 'de', 'fr', 'pt-BR', 'ru'),
        timezone: v => {
            if (v === null || v === undefined || typeof v !== 'string') return undefined;
            const tz = v.trim();
            if (!tz || tz.length > 64) return undefined;
            try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return tz; } catch { return undefined; }
        },
        nsfw: boolRule,
        modLogChannelId: textChannelRule, memberLogChannelId: textChannelRule, messageLogChannelId: textChannelRule,
        muteRoleId: roleRule,
        suggestionsChannelId: textChannelRule, confessionsChannelId: textChannelRule, birthdayChannelId: textChannelRule,
    };

    const result = applyPatch(cfg, patch, rules);
    if (result.error) return { error: `invalid value for: ${result.error}` };
    await cfg.save();
    return { data: guildJson(cfg) };
}

// ── Router ────────────────────────────────────────────────────────────────

// Devuelve todos los canales relevantes con su tipo (texto/voz/categoría/foro),
// excluyendo hilos y canales de anuncio archivados. El dashboard filtra por
// tipo según el contexto (p. ej. canales de voz para el 24/7).
const THREAD_TYPES = new Set([ChannelType.PublicThread, ChannelType.PrivateThread, ChannelType.AnnouncementThread]);
function channelList(guild) {
    return guild.channels.cache
        .filter(c => !THREAD_TYPES.has(c.type))
        .map(c => ({ id: c.id, name: c.name, type: c.type, parentId: c.parentId ?? null, position: c.rawPosition ?? c.position ?? 0 }))
        .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name))
        .slice(0, 500);
}

function roleList(guild) {
    return guild.roles.cache
        .map(r => ({ id: r.id, name: r.name, color: r.hexColor, position: r.position, managed: r.managed, isEveryone: r.id === guild.id }))
        .sort((a, b) => b.position - a.position);
}

async function resolveGuild(client, id) {
    if (!isSnowflake(id)) return null;
    return client.guilds.cache.get(id) || client.guilds.fetch(id).catch(() => null);
}

function startAdminServer(client) {
    if (!config.ADMIN_API_KEY) {
        console.log('[admin] ADMIN_API_KEY no definida; la API del dashboard no arranca.');
        return null;
    }

    const origin = config.DASHBOARD_ORIGIN || null;

    const server = http.createServer(async (req, res) => {
        const ip = clientIp(req);
        const url = new URL(req.url || '/', 'http://localhost');
        const path = url.pathname.replace(/\/+$/, '') || '/';
        const method = (req.method || 'GET').toUpperCase();

        // CORS preflight
        if (method === 'OPTIONS') {
            const headers = { 'Access-Control-Allow-Methods': 'GET, PATCH, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Max-Age': '600' };
            if (origin) headers['Access-Control-Allow-Origin'] = origin;
            res.writeHead(204, headers);
            return res.end();
        }

        if (rateLimited(ip)) return jsonError(res, 429, 'rate_limited', 'Demasiadas peticiones.', origin);

        // Auth
        const auth = req.headers.authorization || '';
        const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
        if (!token || !timingSafeEqualString(token, config.ADMIN_API_KEY)) {
            return jsonError(res, 401, 'unauthorized', 'Credenciales inválidas.', origin);
        }

        if (!path.startsWith('/api/v1')) return jsonError(res, 404, 'not_found', 'Endpoint desconocido.', origin);
        const route = path.slice('/api/v1'.length) || '/';

        try {
            // ── /health ──
            if (route === '/health' && method === 'GET') {
                return sendJson(res, 200, {
                    ok: true,
                    uptimeSeconds: Math.floor(process.uptime()),
                    guilds: client.guilds.cache.size,
                    version: require('../../package.json').version,
                }, origin);
            }

            // ── /guilds ──
            if (route === '/guilds' && method === 'GET') {
                const guilds = [...client.guilds.cache.values()].map(guildSummary);
                return sendJson(res, 200, { guilds }, origin);
            }

            const guildMatch = route.match(/^\/guilds\/(\d{17,20})(\/.*)?$/);
            if (!guildMatch) return jsonError(res, 404, 'not_found', 'Ruta desconocida.', origin);

            const [, guildId, subRaw] = guildMatch;
            const sub = subRaw || '/';
            const guild = await resolveGuild(client, guildId);
            if (!guild) return jsonError(res, 404, 'guild_not_found', 'El bot no está en ese servidor.', origin);

            // ── /guilds/:id/overview ──
            if (sub === '/overview' && method === 'GET') {
                const { Op } = require('sequelize');
                const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                const warnsLast30d = await Warn.count({ where: { guildId, createdAt: { [Op.gte]: since } } }).catch(() => null);
                const [automod, honeypot, antinuke] = await Promise.all([
                    AutomodConfig.findOne({ where: { guildId } }).catch(() => null),
                    HoneypotConfig.findOne({ where: { guildId } }).catch(() => null),
                    AntiNukeConfig.findOne({ where: { guildId } }).catch(() => null),
                ]);
                return sendJson(res, 200, {
                    ...guildSummary(guild),
                    channelCount: guild.channels.cache.size,
                    roleCount: guild.roles.cache.size,
                    boostTier: guild.premiumTier ?? 0,
                    warnsLast30d,
                    security: {
                        automod: Boolean(automod?.enabled),
                        honeypot: Boolean(honeypot?.enabled),
                        antinuke: Boolean(antinuke?.enabled),
                    },
                }, origin);
            }

            // ── /guilds/:id/config (GET agregado) ──
            if (sub === '/config' && method === 'GET') {
                const [guildCfg, automod, honeypot, antinuke, welcome] = await Promise.all([
                    GuildConfig.findOne({ where: { guildId } }).catch(() => null),
                    AutomodConfig.findOne({ where: { guildId } }).catch(() => null),
                    HoneypotConfig.findOne({ where: { guildId } }).catch(() => null),
                    AntiNukeConfig.findOne({ where: { guildId } }).catch(() => null),
                    WelcomeConfig.findOne({ where: { guildId } }).catch(() => null),
                ]);
                return sendJson(res, 200, {
                    guild: guildJson(guildCfg),
                    automod: automodJson(automod),
                    honeypot: honeypotJson(honeypot),
                    antinuke: antinukeJson(antinuke),
                    welcome: welcomeJson(welcome),
                }, origin);
            }

            // ── /guilds/:id/channels y /roles ──
            if (sub === '/channels' && method === 'GET') {
                return sendJson(res, 200, { channels: channelList(guild) }, origin);
            }
            if (sub === '/roles' && method === 'GET') {
                return sendJson(res, 200, { roles: roleList(guild) }, origin);
            }

            // ── Secciones por-guild (GET + PATCH): levels, tickets, music, autorole ──
            const SECTION_SECTIONS = { '/levels': 'levels', '/tickets': 'tickets', '/music': 'music', '/autorole': 'autorole' };
            if (SECTION_SECTIONS[sub]) {
                const section = SECTION_SECTIONS[sub];

                if (method === 'GET') {
                    if (section === 'levels') return sendJson(res, 200, levelsJson(await LevelConfig.findOne({ where: { guildId } }).catch(() => null)), origin);
                    if (section === 'tickets') return sendJson(res, 200, ticketsJson(await TicketConfig.findOne({ where: { guildId } }).catch(() => null)), origin);
                    if (section === 'music') return sendJson(res, 200, musicJson(await MusicConfig.findOne({ where: { guildId } }).catch(() => null)), origin);
                    return sendJson(res, 200, autoroleJson(await AutoRole.findOne({ where: { guildId } }).catch(() => null)), origin);
                }

                if (method === 'PATCH') {
                    let patch;
                    try {
                        patch = await readBody(req);
                    } catch (err) {
                        return jsonError(res, err.code === 'BODY_TOO_LARGE' ? 413 : 400, err.code === 'BODY_TOO_LARGE' ? 'body_too_large' : 'bad_json', err.message, origin);
                    }
                    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
                        return jsonError(res, 400, 'bad_body', 'El cuerpo debe ser un objeto JSON.', origin);
                    }

                    let result;
                    if (section === 'levels') result = await patchLevels(guild, patch);
                    else if (section === 'tickets') result = await patchTickets(guild, patch);
                    else if (section === 'music') result = await patchMusic(guild, patch);
                    else result = await patchAutorole(guild, patch);

                    if (result?.error) return jsonError(res, 400, 'invalid_patch', result.error, origin);
                    return sendJson(res, 200, result.data, origin);
                }
            }

            // ── PATCHes ──
            if (method === 'PATCH' && ['/guild', '/automod', '/honeypot', '/antinuke', '/welcome'].includes(sub)) {
                let patch;
                try {
                    patch = await readBody(req);
                } catch (err) {
                    return jsonError(res, err.code === 'BODY_TOO_LARGE' ? 413 : 400, err.code === 'BODY_TOO_LARGE' ? 'body_too_large' : 'bad_json', err.message, origin);
                }
                if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
                    return jsonError(res, 400, 'bad_body', 'El cuerpo debe ser un objeto JSON.', origin);
                }

                let result;
                if (sub === '/guild') result = await patchGuild(guild, patch);
                else if (sub === '/automod') result = await patchAutomod(guild, patch);
                else if (sub === '/honeypot') result = await patchHoneypot(guild, patch);
                else if (sub === '/antinuke') result = await patchAntiNuke(guild, patch);
                else if (sub === '/welcome') result = await patchWelcome(guild, patch);

                if (result?.error) return jsonError(res, 400, 'invalid_patch', result.error, origin);
                return sendJson(res, 200, result.data, origin);
            }

            return jsonError(res, 404, 'not_found', 'Ruta desconocida.', origin);
        } catch (err) {
            console.error('[admin] Error en', method, route, '-', err);
            return jsonError(res, 500, 'internal', 'Error interno del servidor admin.', origin);
        }
    });

    server.on('error', (err) => {
        console.error(`[admin] No se pudo abrir el puerto ${config.ADMIN_PORT}:`, err.message);
    });

    server.listen(config.ADMIN_PORT, '0.0.0.0', () => {
        console.log(`[admin] API del dashboard escuchando en 0.0.0.0:${config.ADMIN_PORT}`);
    });

    return server;
}

module.exports = { startAdminServer };
