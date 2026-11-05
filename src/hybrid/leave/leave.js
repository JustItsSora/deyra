// src/hybrid/leave/leave.js
const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { successPanel } = require('../../lib/panel');
const { requireMusic, requirePlayer } = require('../../music/lib/musicChecks');
const { safeDestroyPlayer } = require('../../music/utils/playerUtils');

module.exports = {
    data: new SlashCommandBuilder().setName('leave').setDescription('Hace que el bot salga del canal de voz'),

    name: 'leave',
    aliases: ['dc', 'disconnect'],
    category: 'música',
    cooldownMs: 2000,

    async execute(ctx) {
        const client = ctx.client;
        if (!requireMusic(ctx)) return;
        const player = requirePlayer(ctx);
        if (!player) return;

        client.rest.put(`/channels/${player.voiceId}/voice-status`, { body: { status: '' } }).catch(() => {});
        await safeDestroyPlayer(player);

        return reply(ctx, successPanel('Canal de voz abandonado', 'Salí del canal de voz.'));
    },
};
