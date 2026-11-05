// src/hybrid/pause/pause.js
const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { successPanel, warningPanel, infoPanel } = require('../../lib/panel');
const { requireMusic, requirePlayer, requireSameVoiceChannel } = require('../../music/lib/musicChecks');

module.exports = {
    data: new SlashCommandBuilder().setName('pause').setDescription('Pausa la canción actual'),

    name: 'pause',
    category: 'música',
    cooldownMs: 2000,

    async execute(ctx) {
        if (!requireMusic(ctx)) return;
        const player = requirePlayer(ctx);
        if (!player) return;
        if (!requireSameVoiceChannel(ctx, player)) return;

        if (!player.queue.current) {
            return reply(ctx, { ...warningPanel('Nada sonando', 'No hay ninguna canción reproduciéndose ahora.'), ephemeral: true });
        }
        if (player.paused) {
            return reply(ctx, { ...infoPanel('Ya está en pausa', 'El reproductor ya está pausado.'), ephemeral: true });
        }

        await player.pause(true);

        return reply(ctx, successPanel('Pausado', `[${player.queue.current.title}](${player.queue.current.uri})`));
    },
};
