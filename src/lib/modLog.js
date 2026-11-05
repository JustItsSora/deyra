// src/lib/modLog.js — envía un panel al canal de logs configurado del servidor.
const { GuildConfig } = require('../data/models');
const { buildPanel } = require('./panel');
const { MessageFlags } = require('discord.js');

/**
 * @param {import('discord.js').Guild} guild
 * @param {object} opts
 * @param {string} opts.title
 * @param {string} opts.description
 * @param {'primary'|'success'|'error'|'warning'} [opts.tone]
 */
async function logModAction(guild, { title, description, tone = 'warning' }) {
    try {
        const cfg = await GuildConfig.findOne({ where: { guildId: guild.id } });
        if (!cfg?.modLogChannelId) return;

        const channel = await guild.channels.fetch(cfg.modLogChannelId).catch(() => null);
        if (!channel) return;

        await channel.send({
            components: [buildPanel({ title, description, tone })],
            flags: MessageFlags.IsComponentsV2,
        }).catch(() => {});
    } catch (err) {
        console.error('[modLog] Error enviando log de moderación:', err);
    }
}

module.exports = { logModAction };
