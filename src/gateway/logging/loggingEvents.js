// src/gateway/logging/loggingEvents.js
// Feature multi-listener: registros de mensajes y miembros en los canales
// configurados en GuildConfig (memberLogChannelId / messageLogChannelId).
//
// Existían las columnas desde hace tiempo pero nada las leía: configurar un
// canal de logs de mensajes no hacía nada. Este módulo las conecta de verdad.
//
// Protecciones contra spam de logs:
//   · config cacheada 60s (no golpea la DB por cada mensaje borrado)
//   · supresión de ráfagas: máx 12 registros por 30s por tipo y guild;
//     el exceso se cuenta y se resume en un único mensaje de aviso

const { GuildConfig } = require('../../data/models');
const { buildPanel } = require('../../lib/panel');
const { MessageFlags } = require('discord.js');

const configCache = new Map(); // guildId -> { cfg, expires }
const CACHE_TTL_MS = 60 * 1000;

const BUCKET_SIZE = 12;
const BUCKET_WINDOW_MS = 30 * 1000;
const buckets = new Map(); // `${guildId}:${kind}` -> { start, count, dropped }

function getBucket(guildId, kind) {
    const key = `${guildId}:${kind}`;
    const now = Date.now();
    let b = buckets.get(key);
    if (!b || now - b.start > BUCKET_WINDOW_MS) {
        b = { start: now, count: 0, dropped: 0 };
        buckets.set(key, b);
    }
    return b;
}

async function getConfig(guildId) {
    const hit = configCache.get(guildId);
    if (hit && hit.expires > Date.now()) return hit.cfg;
    const cfg = await GuildConfig.findOne({ where: { guildId } }).catch(() => null);
    configCache.set(guildId, { cfg, expires: Date.now() + CACHE_TTL_MS });
    return cfg;
}

async function sendLog(guild, channelId, kind, panel) {
    const bucket = getBucket(guild.id, kind);
    if (bucket.count >= BUCKET_SIZE) {
        bucket.dropped += 1;
        return;
    }
    bucket.count += 1;

    const channel = await guild.channels.fetch(channelId).catch(() => null);
    if (!channel?.send) return;
    await channel.send({ components: [panel], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
}

function init(client) {
    // Resumen periódico de eventos suprimidos por ráfaga.
    const flush = setInterval(async () => {
        for (const [key, bucket] of buckets) {
            if (bucket.dropped === 0) continue;
            const [guildId, kind] = key.split(':');
            const dropped = bucket.dropped;
            bucket.dropped = 0;

            const guild = client.guilds.cache.get(guildId);
            if (!guild) continue;
            const cfg = await getConfig(guildId);
            const targetId = kind === 'member' ? cfg?.memberLogChannelId : cfg?.messageLogChannelId;
            if (!targetId) continue;

            const channel = await guild.channels.fetch(targetId).catch(() => null);
            if (!channel?.send) continue;
            await channel.send({
                components: [buildPanel({
                    title: 'Registros suprimidos',
                    description: `Se omitieron **${dropped}** registros de tipo «${kind === 'member' ? 'miembros' : 'mensajes'}» en los últimos 30s por ráfaga.`,
                    tone: 'warning',
                })],
                flags: MessageFlags.IsComponentsV2,
            }).catch(() => {});
        }
    }, 60 * 1000);
    flush.unref?.();

    client.on('messageDelete', async (message) => {
        if (!message.guild) return;
        try {
            const cfg = await getConfig(message.guild.id);
            if (!cfg?.messageLogChannelId) return;

            const content = message.content || '*(sin texto o no disponible por partial)*';
            const attachments = message.attachments?.size || 0;
            await sendLog(message.guild, cfg.messageLogChannelId, 'message', buildPanel({
                title: 'Mensaje eliminado',
                description: [
                    `**Autor:** ${message.author?.tag || 'desconocido'} (${message.author?.id || '?'})`,
                    `**Canal:** <#${message.channel.id}>`,
                    attachments ? `**Adjuntos:** ${attachments}` : null,
                    `**Contenido:** ${content.slice(0, 900)}`,
                ].filter(Boolean).join('\n'),
                tone: 'warning',
            }));
        } catch (err) {
            console.error('[logging] messageDelete:', err.message);
        }
    });

    client.on('messageUpdate', async (oldMessage, newMessage) => {
        if (!newMessage.guild) return;
        if (oldMessage.content === newMessage.content) return;
        try {
            const cfg = await getConfig(newMessage.guild.id);
            if (!cfg?.messageLogChannelId) return;

            await sendLog(newMessage.guild, cfg.messageLogChannelId, 'message', buildPanel({
                title: 'Mensaje editado',
                description: [
                    `**Autor:** ${newMessage.author?.tag || 'desconocido'} (${newMessage.author?.id || '?'})`,
                    `**Canal:** <#${newMessage.channel.id}>`,
                    `**Antes:** ${(oldMessage.content || '*(vacío)*').slice(0, 400)}`,
                    `**Después:** ${(newMessage.content || '*(vacío)*').slice(0, 400)}`,
                ].join('\n'),
                tone: 'info',
            }));
        } catch (err) {
            console.error('[logging] messageUpdate:', err.message);
        }
    });

    client.on('guildMemberAdd', async (member) => {
        try {
            const cfg = await getConfig(member.guild.id);
            if (!cfg?.memberLogChannelId) return;

            await sendLog(member.guild, cfg.memberLogChannelId, 'member', buildPanel({
                title: 'Miembro unido',
                description: [
                    `**Usuario:** ${member.user.tag} (${member.id})`,
                    `**Cuenta creada:** <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`,
                    `**Miembros:** ${member.guild.memberCount}`,
                ].join('\n'),
                tone: 'success',
            }));
        } catch (err) {
            console.error('[logging] guildMemberAdd:', err.message);
        }
    });

    client.on('guildMemberRemove', async (member) => {
        try {
            const cfg = await getConfig(member.guild.id);
            if (!cfg?.memberLogChannelId) return;

            await sendLog(member.guild, cfg.memberLogChannelId, 'member', buildPanel({
                title: 'Miembro salió',
                description: [
                    `**Usuario:** ${member.user?.tag || 'desconocido'} (${member.id})`,
                    `**Miembros:** ${member.guild.memberCount}`,
                ].join('\n'),
                tone: 'neutral',
            }));
        } catch (err) {
            console.error('[logging] guildMemberRemove:', err.message);
        }
    });
}

module.exports = { init };
