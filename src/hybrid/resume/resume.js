// src/hybrid/resume/resume.js
const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { successPanel, warningPanel, infoPanel } = require('../../lib/panel');
const { requireMusic, requirePlayer, requireSameVoiceChannel } = require('../../music/lib/musicChecks');

module.exports = {
    data: new SlashCommandBuilder().setName('resume').setDescription('Reanuda la canción pausada'),

    name: 'resume',
    aliases: ['unpause'],
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
        if (!player.paused) {
            return reply(ctx, { ...infoPanel('No está pausado', 'El reproductor no está en pausa.'), ephemeral: true });
        }

        await player.pause(false);

        return reply(ctx, successPanel('Reanudado', `[${player.queue.current.title}](${player.queue.current.uri})`));
    },
};
