// src/hybrid/autoplay/autoplay.js
const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { successPanel } = require('../../lib/panel');
const { requireMusic, requirePlayer, requireSameVoiceChannel } = require('../../music/lib/musicChecks');

module.exports = {
    data: new SlashCommandBuilder().setName('autoplay').setDescription('Activa o desactiva el autoplay (sigue poniendo canciones similares al terminar la cola)'),

    name: 'autoplay',
    aliases: ['ap'],
    category: 'música',
    cooldownMs: 2000,

    async execute(ctx) {
        if (!requireMusic(ctx)) return;
        const player = requirePlayer(ctx);
        if (!player) return;
        if (!requireSameVoiceChannel(ctx, player)) return;

        const currentStatus = player.data.get('autoplay') || false;
        const newStatus = !currentStatus;
        player.data.set('autoplay', newStatus);

        return reply(ctx, successPanel('Autoplay actualizado', `El autoplay ahora está **${newStatus ? 'activado' : 'desactivado'}**.`));
    },
};
