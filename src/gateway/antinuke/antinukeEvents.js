// src/gateway/antinuke/antinukeEvents.js
// Feature multi-listener: anti-nuke sobre el audit log de Discord.
//
// Un "nuke" es una cuenta con permisos haciendo ráfagas de daño: borrar
// canales, borrar roles, banear en masa, crear webhooks o meter bots. El
// patrón en común no es la acción concreta sino la VELOCIDAD y el AUTOR: el
// audit log dice quién fue. Deyra mantiene una ventana por autor y, al pasar
// el umbral, aplica la acción configurada:
//   · ban    → banea al autor (la opción nuclear, literal)
//   · derank → le quita todos los roles (reversible, recomendado si hay duda)
//   · log    → solo registra (modo observación)
//
// Nunca actúa sobre el dueño del servidor, sobre otros bots ni sobre los
// usuarios/roles en la whitelist.

const { AuditLogEvent, PermissionsBitField } = require('discord.js');
const { AntiNukeConfig } = require('../../data/models');
const { logModAction } = require('../../lib/modLog');
const { emoji } = require('../../lib/emojis');

// Acciones del audit log que cuentan para la detección. RoleUpdate solo
// cuenta cuando cambia `permissions` (grant masivo de permisos es vector de
// nuke; recolorear un rol no).
const WATCHED = new Map([
    [AuditLogEvent.ChannelDelete, 'Canal borrado'],
    [AuditLogEvent.RoleDelete, 'Rol borrado'],
    [AuditLogEvent.RoleCreate, 'Rol creado'],
    [AuditLogEvent.MemberBanAdd, 'Usuario baneado'],
    [AuditLogEvent.WebhookCreate, 'Webhook creado'],
    [AuditLogEvent.BotAdd, 'Bot añadido'],
]);
const ROLE_PERM_UPDATE = AuditLogEvent.RoleUpdate;

const cache = new Map(); // guildId -> { config|null, expires }
const CACHE_TTL_MS = 30 * 1000;

// `${guildId}:${executorId}` -> [timestamps]
const tracker = new Map();
// `${guildId}:${executorId}` -> timestamp de la última neutralización (dedupe)
const neutralized = new Map();

function invalidateCache(guildId) {
    if (guildId) cache.delete(guildId);
    else cache.clear();
}

async function getConfig(guildId) {
    const hit = cache.get(guildId);
    if (hit && hit.expires > Date.now()) return hit.config;

    const config = await AntiNukeConfig.findOne({ where: { guildId } }).catch(() => null);
    cache.set(guildId, { config, expires: Date.now() + CACHE_TTL_MS });
    return config;
}

function recordAndCount(key, windowMs) {
    const now = Date.now();
    const entries = (tracker.get(key) || []).filter(t => now - t < windowMs);
    entries.push(now);

    if (entries.length === 0) tracker.delete(key);
    else tracker.set(key, entries);

    return entries.length;
}

function alreadyNeutralized(key, windowMs) {
    const last = neutralized.get(key);
    neutralized.set(key, Date.now());
    return last !== undefined && Date.now() - last < windowMs;
}

function init(client) {
    client.on('guildAuditLogEntryCreate', async (entry, guild) => {
        if (!entry?.executorId || !guild) return;

        const isPermissionRoleUpdate = entry.action === ROLE_PERM_UPDATE
            && Array.isArray(entry.changes)
            && entry.changes.some(c => c.key === 'permissions');
        const watched = WATCHED.get(entry.action) || (isPermissionRoleUpdate ? 'Permisos de rol modificados' : null);
        if (!watched) return;

        // El propio bot y el dueño nunca cuentan (ni se tocan).
        if (entry.executorId === client.user.id || entry.executorId === guild.ownerId) return;

        try {
            const config = await getConfig(guild.id);
            if (!config?.enabled) return;

            const executor = await guild.members.fetch(entry.executorId).catch(() => null);
            if (executor?.user?.bot) return; // otros bots del servidor no disparan el anti-nuke

            const whitelistedUsers = JSON.parse(config.whitelistedUsers || '[]');
            if (whitelistedUsers.includes(entry.executorId)) return;
            const whitelistedRoles = JSON.parse(config.whitelistedRoles || '[]');
            if (executor?.roles?.cache?.some(r => whitelistedRoles.includes(r.id))) return;

            const windowMs = Math.max(1, config.windowMinutes) * 60 * 1000;
            const key = `${guild.id}:${entry.executorId}`;
            const count = recordAndCount(key, windowMs);
            if (count < config.threshold) return;
            if (alreadyNeutralized(key, windowMs)) return;

            const reason = `Anti-nuke: ${count} acciones destructivas en ${config.windowMinutes} min (última: ${watched})`;
            let applied = 'ninguno';

            if (config.action === 'ban') {
                if (executor) {
                    await executor.ban({ reason, deleteMessageSeconds: 0 }).then(() => { applied = 'ban'; }).catch(() => { applied = 'falló (jerarquía/permisos)'; });
                } else {
                    applied = 'falló (miembro no encontrado)';
                }
            } else if (config.action === 'derank') {
                if (executor) {
                    await executor.roles.set([], reason).then(() => { applied = 'derank (roles revocados)'; }).catch(() => { applied = 'falló (jerarquía/permisos)'; });
                } else {
                    applied = 'falló (miembro no encontrado)';
                }
            } else if (config.action === 'log') {
                applied = 'solo registro';
            }

            await logModAction(guild, {
                title: `${emoji('SHIELD')} Anti-nuke: ${config.action === 'log' ? 'patrón detectado' : 'cuenta neutralizada'}`,
                description: [
                    `**Autor:** ${executor?.user?.tag || entry.executorId} (${entry.executorId})`,
                    `**Acciones detectadas:** ${count} en ${config.windowMinutes} min`,
                    `**Última acción:** ${watched}`,
                    `**Respuesta:** \`${applied}\``,
                ].join('\n'),
                tone: 'error',
            });

            // El conteo vuelve a cero: la ráfaga ya fue contenida.
            tracker.delete(key);
        } catch (err) {
            console.error('[antinuke] Error evaluando audit log:', err);
        }
    });
}

module.exports = { init, invalidateCache };
