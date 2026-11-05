// src/hybrid/stop/stop.js
const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { successPanel } = require('../../lib/panel');
const { requireMusic, requirePlayer, requireSameVoiceChannel } = require('../../music/lib/musicChecks');
const { safeDestroyPlayer } = require('../../music/utils/playerUtils');

module.exports = {
    data: new SlashCommandBuilder().setName('stop').setDescription('Detiene la música y vacía la cola'),

    name: 'stop',
    aliases: ['disconnectplayer'],
    category: 'música',
    cooldownMs: 2000,

    async execute(ctx) {
        if (!requireMusic(ctx)) return;
        const player = requirePlayer(ctx);
        if (!player) return;
        if (!requireSameVoiceChannel(ctx, player)) return;

        player.queue.clear();
        if (player.setLoop) player.setLoop('none');
        await safeDestroyPlayer(player);

        return reply(ctx, successPanel('Reproducción detenida', 'Se vació la cola y me desconecté del canal de voz.'));
    },
};
