// src/hybrid/leavecleanup/leavecleanup.js
const { SlashCommandBuilder } = require('discord.js');
const { reply, getMember } = require('../../lib/reply');
const { successPanel, warningPanel, infoPanel } = require('../../lib/panel');
const { requireMusic, requirePlayer, requireVoiceChannel } = require('../../music/lib/musicChecks');

module.exports = {
    data: new SlashCommandBuilder().setName('leavecleanup').setDescription('Quita de la cola las canciones pedidas por usuarios que ya no están en el canal de voz'),

    name: 'leavecleanup',
    aliases: ['cleanup'],
    category: 'música',
    cooldownMs: 3000,

    async execute(ctx) {
        if (!requireMusic(ctx)) return;
        const player = requirePlayer(ctx);
        if (!player) return;

        if (!player.queue.current) {
            return reply(ctx, { ...warningPanel('Nada sonando', 'No hay ninguna canción reproduciéndose ahora.'), ephemeral: true });
        }
        if (player.queue.length === 0) {
            return reply(ctx, { ...infoPanel('Cola vacía', 'La cola está vacía.'), ephemeral: true });
        }

        if (!requireVoiceChannel(ctx)) return;

        const member = getMember(ctx);
        const voiceChannelMembers = member.voice.channel.members.map((m) => m.id);
        const removedTracks = [];
        const removedUsers = new Set();

        for (let i = player.queue.length - 1; i >= 0; i--) {
            const track = player.queue[i];
            if (track.requester && !voiceChannelMembers.includes(track.requester.id)) {
                removedTracks.push(track);
                removedUsers.add(track.requester.id);
                player.queue.splice(i, 1);
            }
        }

        if (removedTracks.length === 0) {
            return reply(ctx, { ...infoPanel('Nada que limpiar', 'No hay canciones pedidas por usuarios que ya se hayan ido del canal de voz.'), ephemeral: true });
        }

        return reply(ctx, successPanel('Limpieza completada', `Se quitaron \`${removedTracks.length}\` canción(es) de \`${removedUsers.size}\` usuario(s) que ya no están en el canal.`));
    },
};
