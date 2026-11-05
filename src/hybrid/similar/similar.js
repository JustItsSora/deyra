// src/hybrid/similar/similar.js
const {
    ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder,
    TextDisplayBuilder, SeparatorBuilder, MessageFlags, SlashCommandBuilder,
} = require('discord.js');
const { isSlash, replyAndGetMessage } = require('../../lib/reply');
const { warningPanel } = require('../../lib/panel');
const { requireMusic, requirePlayer } = require('../../music/lib/musicChecks');
const config = require('../../config');

function formatDuration(ms) {
    if (!ms || ms <= 0) return 'En vivo';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

function cleanAuthor(author) {
    return (author || '').replace(/\s*-\s*Topic\s*$/i, '').trim();
}

function statusContainer(text) {
    return new ContainerBuilder().setAccentColor(config.COLORS.PRIMARY)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(text));
}

module.exports = {
    data: new SlashCommandBuilder().setName('similar').setDescription('Busca canciones parecidas a la que está sonando'),

    name: 'similar',
    aliases: ['related'],
    category: 'música',
    cooldownMs: 5000,

    async execute(ctx) {
        const client = ctx.client;
        if (!requireMusic(ctx)) return;
        const player = requirePlayer(ctx);
        if (!player) return;

        if (!player.queue.current) {
            const payload = { ...warningPanel('Nada sonando', 'Poné una canción primero.'), ephemeral: true };
            return (isSlash(ctx) ? ctx.reply(payload) : ctx.reply(payload)).catch(() => {});
        }

        const current = player.queue.current;
        const author = cleanAuthor(current.author);
        const requester = isSlash(ctx) ? ctx.user : ctx.author;
        const userId = requester.id;
        const guildId = ctx.guildId || ctx.guild?.id;

        const loadingPayload = { components: [statusContainer(`⏳ Buscando canciones parecidas a **${current.title}**...`)], flags: MessageFlags.IsComponentsV2 };
        const loading = await replyAndGetMessage(ctx, loadingPayload);
        if (!loading) return;

        let result;
        try {
            result = await client.music.search(`${author} mix`, { requester });
        } catch (_) {
            result = { tracks: [] };
        }

        const tracks = (result?.tracks || [])
            .filter((t) => t.uri !== current.uri && t.identifier !== current.identifier)
            .slice(0, 10);

        if (tracks.length === 0) {
            return loading.edit({ components: [statusContainer('❌ No pude encontrar canciones parecidas ahora mismo.')], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
        }

        const perPage = 5;
        let page = 0;
        const totalPages = Math.ceil(tracks.length / perPage);

        const generateContainer = (p) => {
            const start = p * perPage;
            const pageTracks = tracks.slice(start, start + perPage);
            const list = pageTracks.map((t, i) => `**\`${start + i + 1}\`** | [${t.title}](${t.uri}) — \`${formatDuration(t.length)}\``).join('\n');

            return new ContainerBuilder().setAccentColor(config.COLORS.PRIMARY)
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### 🎵 Parecidas a ${current.title}`))
                .addSeparatorComponents(new SeparatorBuilder())
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(list))
                .addSeparatorComponents(new SeparatorBuilder())
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# Página ${p + 1}/${totalPages}`));
        };

        const generateButtons = (p) => new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('sim_prev').setLabel('Anterior').setStyle(ButtonStyle.Secondary).setDisabled(p === 0),
            new ButtonBuilder().setCustomId('sim_next').setLabel('Siguiente').setStyle(ButtonStyle.Secondary).setDisabled(p === totalPages - 1),
            new ButtonBuilder().setCustomId('sim_all').setLabel('Agregar todas').setStyle(ButtonStyle.Success),
        );

        await loading.edit({
            components: totalPages > 1 ? [generateContainer(0), generateButtons(0)] : [generateContainer(0)],
            flags: MessageFlags.IsComponentsV2,
        }).catch(() => {});

        const collector = loading.createMessageComponentCollector({
            filter: (i) => i.user.id === userId,
            time: 120000,
        });

        collector.on('collect', async (i) => {
            await i.deferUpdate().catch(() => {});

            if (i.customId === 'sim_prev') {
                page = page > 0 ? page - 1 : totalPages - 1;
                await i.editReply({ components: [generateContainer(page), generateButtons(page)] }).catch(() => {});
            } else if (i.customId === 'sim_next') {
                page = page + 1 < totalPages ? page + 1 : 0;
                await i.editReply({ components: [generateContainer(page), generateButtons(page)] }).catch(() => {});
            } else if (i.customId === 'sim_all') {
                const currentPlayer = client.music.players.get(guildId);
                if (!currentPlayer) return;
                tracks.forEach((t) => currentPlayer.queue.add(t));
                if (!currentPlayer.playing && !currentPlayer.paused) await currentPlayer.play();
                i.channel.send({ components: [statusContainer(`✅ Agregué las ${tracks.length} canciones parecidas a la cola.`)], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
            }
        });

        collector.on('end', () => {
            loading.edit({ components: [generateContainer(page)] }).catch(() => {});
        });
    },
};
