// src/hybrid/queueshuffle/queueshuffle.js
// NOTA DE FUSIÓN: Deyra ya tenía un comando "/shuffle" (mezclar listas, en
// utilidad). Este es el "shuffle" de música que traía Valk — se renombró a
// "queueshuffle" para no perder ninguna de las dos funciones.
const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { successPanel, warningPanel, infoPanel } = require('../../lib/panel');
const { requireMusic, requirePlayer, requireSameVoiceChannel } = require('../../music/lib/musicChecks');

module.exports = {
    data: new SlashCommandBuilder().setName('queueshuffle').setDescription('Mezcla el orden de la cola de música'),

    name: 'queueshuffle',
    aliases: ['qshuffle', 'mezclarcola'],
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
        if (player.queue.length < 2) {
            return reply(ctx, { ...infoPanel('Cola muy corta', 'No hay suficientes canciones en la cola para mezclar.'), ephemeral: true });
        }

        await player.queue.shuffle();

        return reply(ctx, successPanel('Cola mezclada', 'El orden de la cola de música fue mezclado.'));
    },
};
