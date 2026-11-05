// src/hybrid/skip/skip.js
const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { successPanel, warningPanel } = require('../../lib/panel');
const { requireMusic, requirePlayer, requireSameVoiceChannel } = require('../../music/lib/musicChecks');

module.exports = {
    data: new SlashCommandBuilder().setName('skip').setDescription('Salta a la siguiente canción de la cola'),

    name: 'skip',
    aliases: ['s'],
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

        const currentTrack = player.queue.current;
        await player.skip();

        return reply(ctx, successPanel('Canción saltada', `[${currentTrack.title}](${currentTrack.uri})`));
    },
};
