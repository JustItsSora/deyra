// src/hybrid/replay/replay.js
const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { successPanel, warningPanel, errorPanel } = require('../../lib/panel');
const { requireMusic, requirePlayer, requireSameVoiceChannel } = require('../../music/lib/musicChecks');

module.exports = {
    data: new SlashCommandBuilder().setName('replay').setDescription('Reinicia la canción actual desde el principio'),

    name: 'replay',
    category: 'música',
    cooldownMs: 2000,

    async execute(ctx) {
        if (!requireMusic(ctx)) return;
        const player = requirePlayer(ctx);
        if (!player) return;
        if (!requireSameVoiceChannel(ctx, player)) return;

        if (!player.queue.current) {
            return reply(ctx, { ...warningPanel('Nada sonando', 'Poné una canción primero.'), ephemeral: true });
        }

        const track = player.queue.current;

        try {
            await player.seek(0);
            return reply(ctx, successPanel('Repitiendo', `[${track.title}](${track.uri})`));
        } catch (err) {
            return reply(ctx, { ...errorPanel('No se pudo repetir', err.message), ephemeral: true });
        }
    },
};
