// src/hybrid/clearqueue/clearqueue.js
const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { successPanel, warningPanel } = require('../../lib/panel');
const { requireMusic, requirePlayer, requireSameVoiceChannel } = require('../../music/lib/musicChecks');

module.exports = {
    data: new SlashCommandBuilder().setName('clearqueue').setDescription('Vacía toda la cola (la canción actual sigue sonando)'),

    name: 'clearqueue',
    aliases: ['cq'],
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

        player.queue.clear();

        return reply(ctx, successPanel('Cola vaciada', 'Se eliminaron todas las canciones en espera.'));
    },
};
