// src/hybrid/artistradio/artistradio.js
const { MessageFlags, ContainerBuilder, TextDisplayBuilder, SlashCommandBuilder } = require('discord.js');
const { isSlash, getMember, replyAndGetMessage } = require('../../lib/reply');
const { errorPanel, infoPanel } = require('../../lib/panel');
const { requireMusic, requireVoiceChannel, isNoNodeError, noNodePanel } = require('../../music/lib/musicChecks');
const config = require('../../config');

function cleanAuthor(author) {
    return (author || '').replace(/\s*-\s*Topic\s*$/i, '').trim();
}

function statusContainer(text) {
    return new ContainerBuilder().setAccentColor(config.COLORS.PRIMARY)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(text));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('artistradio')
        .setDescription('Arma una mezcla infinita de canciones de un artista')
        .addStringOption((o) => o.setName('artista').setDescription('Nombre del artista (opcional si ya hay algo sonando)')),

    name: 'artistradio',
    aliases: ['radio'],
    category: 'música',
    cooldownMs: 5000,

    async execute(ctx, args = []) {
        const client = ctx.client;
        if (!requireMusic(ctx)) return;

        let artistQuery = (isSlash(ctx) ? ctx.options.getString('artista') : args.join(' '))?.trim();
        const guildId = ctx.guildId || ctx.guild?.id;

        if (!artistQuery) {
            const player = client.music.players.get(guildId);
            if (!player?.queue.current) {
                const payload = { ...infoPanel('Falta el artista', 'Uso: `/artistradio artista:<nombre>`\nO poné una canción primero para usar el artista actual.'), ephemeral: true };
                return (isSlash(ctx) ? ctx.reply(payload) : ctx.reply(payload)).catch(() => {});
            }
            artistQuery = cleanAuthor(player.queue.current.author);
        }

        if (!requireVoiceChannel(ctx)) return;
        const member = getMember(ctx);
        const channel = member.voice.channel;

        let player = client.music.players.get(guildId);
        if (!player) {
            try {
                player = await client.music.createPlayer({
                    guildId, voiceId: channel.id, textId: ctx.channelId || ctx.channel?.id, volume: 80, deaf: true,
                });
            } catch (err) {
                if (isNoNodeError(err)) {
                    console.error('[artistradio] Sin nodo de Lavalink:', err.message);
                    const payload = { ...noNodePanel(client.music), ephemeral: true };
                    return (isSlash(ctx) ? ctx.reply(payload) : ctx.reply(payload)).catch(() => {});
                }
                const payload = { ...errorPanel('No pude unirme', err.message), ephemeral: true };
                return (isSlash(ctx) ? ctx.reply(payload) : ctx.reply(payload)).catch(() => {});
            }
        }

        const requester = isSlash(ctx) ? ctx.user : ctx.author;
        const loadingPayload = { components: [statusContainer(`⏳ Armando una radio para **${artistQuery}**...`)], flags: MessageFlags.IsComponentsV2 };
        const loading = await replyAndGetMessage(ctx, loadingPayload);
        if (!loading) return;

        let result;
        try {
            result = await player.search(`${artistQuery} radio mix`, { requester });
            if (!result?.tracks?.length) {
                result = await player.search(artistQuery, { requester });
            }
        } catch (_) {
            result = { tracks: [] };
        }

        const tracks = (result?.tracks || []).slice(0, 15);

        if (tracks.length === 0) {
            return loading.edit({ components: [statusContainer(`❌ No pude armar una radio para **${artistQuery}**.`)], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
        }

        tracks.forEach((t) => player.queue.add(t));
        if (!player.playing && !player.paused) await player.play();

        return loading.edit({ components: [statusContainer(`✅ Agregué **${tracks.length}** canciones a la radio de **${artistQuery}**.`)], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    },
};
