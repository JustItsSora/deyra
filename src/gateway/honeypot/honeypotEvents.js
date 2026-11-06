// src/gateway/honeypot/honeypotEvents.js
// Feature multi-listener: trampa para bots de spam y raiders.
//
// El servidor tiene un canal que parece legítimo ("free-gifts", "ofertas"...)
// pero que ningún humano usa: al configurarlo se deja un aviso en el
// topic. Cualquiera que escriba en él demuestra que actúa de forma
// automática o maliciosa — los humanos leen el topic antes de escribir y los
// bots no. Deyra ejecuta el castigo configurado y lo registra.

const { PermissionsBitField } = require('discord.js');
const { HoneypotConfig } = require('../../data/models');
const { logModAction } = require('../../lib/modLog');
const { emoji } = require('../../lib/emojis');
const { botCanModerate } = require('../../lib/permissions');

const cache = new Map(); // guildId -> { config|null, expires }
const CACHE_TTL_MS = 30 * 1000;

function invalidateCache(guildId) {
    if (guildId) cache.delete(guildId);
    else cache.clear();
}

async function getConfig(guildId) {
    const hit = cache.get(guildId);
    if (hit && hit.expires > Date.now()) return hit.config;

    const config = await HoneypotConfig.findOne({ where: { guildId } }).catch(() => null);
    cache.set(guildId, { config, expires: Date.now() + CACHE_TTL_MS });
    return config;
}

function init(client) {
    client.on('messageCreate', async (message) => {
        if (!message.guild) return;
        if (message.author?.id === client.user.id) return;

        try {
            const config = await getConfig(message.guild.id);
            if (!config?.enabled || !config.channelId) return;
            if (message.channel.id !== config.channelId) return;

            const member = message.member;
            if (!member) return;

            // Nunca castigar al dueño ni a quien puede gestionar el servidor:
            // un admin moderando el honeypot no debe autobanease.
            if (member.id === message.guild.ownerId) return;
            if (member.permissions?.has(PermissionsBitField.Flags.ManageGuild)) return;

            await message.delete().catch(() => {});

            const reason = 'Honeypot: escribió en el canal señuelo';
            let applied = 'ninguno';
            if (botCanModerate(message.guild, member)) {
                try {
                    if (config.action === 'timeout') {
                        await member.timeout(config.timeoutMinutes * 60 * 1000, reason);
                        applied = `timeout ${config.timeoutMinutes} min`;
                    } else if (config.action === 'kick') {
                        await member.kick(reason);
                        applied = 'kick';
                    } else if (config.action === 'ban') {
                        await member.ban({ reason, deleteMessageSeconds: 3600 });
                        applied = 'ban';
                    }
                } catch (err) {
                    console.error('[honeypot] Error aplicando castigo:', err);
                }
            } else {
                applied = 'sin jerarquía (registrado)';
            }

            // Contador de capturas + purge opcional del canal señuelo.
            config.caughtCount = (config.caughtCount || 0) + 1;
            await config.save().catch(() => {});

            if (config.autoPurge) {
                try {
                    const recent = await message.channel.messages.fetch({ limit: 100 }).catch(() => null);
                    const own = recent
                        ? recent.filter(m => m.author.id === message.author.id && Date.now() - m.createdTimestamp < 14 * 24 * 60 * 60 * 1000)
                        : null;
                    if (own && own.size > 0) await message.channel.bulkDelete(own, true).catch(() => {});
                } catch (err) {
                    console.error('[honeypot] Error en autoPurge:', err.message);
                }
            }

            await logModAction(message.guild, {
                title: `${emoji('SHIELD')} Honeypot: trampa activada`,
                description: [
                    `**Usuario:** ${member.user.tag} (${member.id})${member.user.bot ? ' [bot]' : ''}`,
                    `**Canal:** <#${config.channelId}>`,
                    `**Acción:** \`${applied}\``,
                    `**Contenido:** ${(message.content || '*(vacío)*').slice(0, 200)}`,
                ].join('\n'),
                tone: 'warning',
            });
        } catch (err) {
            console.error('[honeypot] Error procesando mensaje:', err);
        }
    });
}

module.exports = { init, invalidateCache };
