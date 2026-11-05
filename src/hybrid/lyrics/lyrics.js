// src/hybrid/lyrics/lyrics.js
const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags } = require('discord.js');
const axios = require('axios');
const { isSlash, replyAndGetMessage } = require('../../lib/reply');
const { warningPanel, infoPanel } = require('../../lib/panel');
const { requireMusic, requirePlayer } = require('../../music/lib/musicChecks');
const config = require('../../config');

function cleanTitle(title) {
    return (title || '').replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').trim();
}

function cleanAuthor(author) {
    return (author || '').replace(/\s*-\s*Topic\s*$/i, '').trim();
}

async function fetchLyrics(title, artist) {
    try {
        const response = await axios.get('https://lrclib.net/api/search', {
            params: { track_name: title, artist_name: artist },
            timeout: 7000,
        });

        if (response.data?.length > 0) {
            const result = response.data[0];
            const lyrics = result.plainLyrics || result.syncedLyrics;
            if (lyrics) return { lyrics, source: 'LRCLib' };
        }
    } catch (_) {}
    return null;
}

function splitLyrics(lyrics, maxLength = 3500) {
    if (lyrics.length <= maxLength) return [lyrics];
    const chunks = [];
    let remaining = lyrics;
    while (remaining.length > 0) {
        if (remaining.length <= maxLength) {
            chunks.push(remaining);
            break;
        }
        let cutIndex = remaining.lastIndexOf('\n', maxLength);
        if (cutIndex <= 0) cutIndex = maxLength;
        chunks.push(remaining.slice(0, cutIndex));
        remaining = remaining.slice(cutIndex).trim();
    }
    return chunks;
}

module.exports = {
    data: new SlashCommandBuilder().setName('lyrics').setDescription('Muestra la letra de la canción que está sonando'),

    name: 'lyrics',
    category: 'música',
    cooldownMs: 5000,

    async execute(ctx) {
        if (!requireMusic(ctx)) return;
        const player = requirePlayer(ctx);
        if (!player) return;

        if (!player.queue.current) {
            return (isSlash(ctx) ? ctx.reply({ ...warningPanel('Nada sonando', 'No hay ninguna canción reproduciéndose ahora.'), flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral}) : ctx.reply(warningPanel('Nada sonando', 'No hay ninguna canción reproduciéndose ahora.'))).catch(() => {});
        }

        const track = player.queue.current;
        const loadingPayload = infoPanel('Buscando la letra...', undefined);
        const loadingMsg = await replyAndGetMessage(ctx, loadingPayload);

        const title = cleanTitle(track.title);
        const artist = cleanAuthor(track.author);
        const result = await fetchLyrics(title, artist);

        if (!result) {
            const notFound = { ...warningPanel('Sin resultados', `No encontré la letra de **${title}** de **${artist}**.`), flags: MessageFlags.IsComponentsV2 };
            if (loadingMsg) return loadingMsg.edit(notFound).catch(() => {});
            return;
        }

        const chunks = splitLyrics(result.lyrics);
        const channel = ctx.channel;

        const container = new ContainerBuilder().setAccentColor(config.COLORS.PRIMARY)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### 🎵 ${track.title}`))
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Artista:** \`${artist}\` • **Fuente:** \`${result.source}\``))
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(chunks[0]));

        if (loadingMsg) await loadingMsg.edit({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => {});

        for (let i = 1; i < chunks.length; i++) {
            const nextContainer = new ContainerBuilder().setAccentColor(config.COLORS.PRIMARY)
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(chunks[i]));
            await channel?.send({ components: [nextContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
        }
    },
};
