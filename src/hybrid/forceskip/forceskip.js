// src/hybrid/forceskip/forceskip.js
const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { successPanel, warningPanel } = require('../../lib/panel');
const { requireMusic, requirePlayer } = require('../../music/lib/musicChecks');

module.exports = {
    data: new SlashCommandBuilder().setName('forceskip').setDescription('Fuerza el salto de la canción actual (sin requerir estar en el canal de voz)'),

    name: 'forceskip',
    aliases: ['fs'],
    category: 'música',
    cooldownMs: 2000,

    async execute(ctx) {
        if (!requireMusic(ctx)) return;
        const player = requirePlayer(ctx);
        if (!player) return;

        if (!player.queue.current) {
            return reply(ctx, { ...warningPanel('Nada sonando', 'No hay ninguna canción reproduciéndose ahora.'), ephemeral: true });
        }

        const currentTrack = player.queue.current;
        await player.skip();

        return reply(ctx, successPanel('Salto forzado', `[${currentTrack.title}](${currentTrack.uri})`));
    },
};
