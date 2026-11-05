// src/hybrid/previous/previous.js
const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { successPanel, infoPanel, errorPanel } = require('../../lib/panel');
const { requireMusic, requirePlayer, requireSameVoiceChannel } = require('../../music/lib/musicChecks');

module.exports = {
    data: new SlashCommandBuilder().setName('previous').setDescription('Reproduce la canción anterior'),

    name: 'previous',
    aliases: ['prev', 'back'],
    category: 'música',
    cooldownMs: 2000,

    async execute(ctx) {
        if (!requireMusic(ctx)) return;
        const player = requirePlayer(ctx);
        if (!player) return;
        if (!requireSameVoiceChannel(ctx, player)) return;

        const history = player.data.get('history') || [];
        if (history.length === 0) {
            return reply(ctx, { ...infoPanel('Sin historial', 'No hay canciones anteriores en el historial.'), ephemeral: true });
        }

        try {
            const previousTrackData = history[history.length - 1];
            const requester = isSlash(ctx) ? ctx.user : ctx.author;
            const searchResult = await player.search(previousTrackData.uri || previousTrackData.title, { requester });

            if (!searchResult?.tracks?.length) {
                return reply(ctx, { ...errorPanel('No encontrada', 'No pude encontrar la canción anterior.'), ephemeral: true });
            }

            const previousTrack = searchResult.tracks[0];
            history.pop();
            player.data.set('history', history);
            player.queue.unshift(previousTrack);
            player.data.set('autoplayAdded', false);

            await player.skip();

            return reply(ctx, successPanel('Reproduciendo anterior', `[${previousTrack.title}](${previousTrack.uri})`));
        } catch (err) {
            return reply(ctx, { ...errorPanel('Error', `No se pudo reproducir la canción anterior: ${err.message}`), ephemeral: true });
        }
    },
};
