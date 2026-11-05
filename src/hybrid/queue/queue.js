// src/hybrid/queue/queue.js
const {
    SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags,
} = require('discord.js');
const { isSlash } = require('../../lib/reply');
const { warningPanel } = require('../../lib/panel');
const { requireMusic, requirePlayer } = require('../../music/lib/musicChecks');
const { emoji } = require('../../lib/emojis');
const config = require('../../config');

function formatDuration(ms) {
    if (!ms || ms <= 0) return 'En vivo';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

module.exports = {
    data: new SlashCommandBuilder().setName('queue').setDescription('Muestra la cola de canciones actual'),

    name: 'queue',
    aliases: ['q'],
    category: 'música',
    cooldownMs: 3000,

    async execute(ctx) {
        if (!requireMusic(ctx)) return;
        const player = requirePlayer(ctx);
        if (!player) return;

        if (!player.queue.current) {
            const payload = { ...warningPanel('Nada sonando', 'No hay ninguna canción reproduciéndose ahora.'), ephemeral: true };
            return (isSlash(ctx) ? ctx.reply(payload) : ctx.reply(payload)).catch(() => {});
        }

        const queue = player.queue;
        const perPage = 10;
        const pages = Math.max(1, Math.ceil((queue.length || 1) / perPage));
        let page = 0;
        const current = queue.current;

        const generateContainer = (pageIdx) => {
            const start = pageIdx * perPage;
            const queueList = queue.slice(start, start + perPage);

            const container = new ContainerBuilder().setAccentColor(config.COLORS.PRIMARY)
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### ${emoji('MUSIC')} Cola de música`))
                .addSeparatorComponents(new SeparatorBuilder())
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`**\`Ahora\`** | [${current.title}](${current.uri}) — \`${formatDuration(current.length)}\``),
                );

            const queueText = queueList.map((track, i) => `**\`${start + i + 1}\`** | [${track.title}](${track.uri}) — \`${formatDuration(track.length)}\``).join('\n');

            if (queueText) {
                container.addSeparatorComponents(new SeparatorBuilder());
                container.addTextDisplayComponents(new TextDisplayBuilder().setContent(queueText));
            }

            container.addSeparatorComponents(new SeparatorBuilder());
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`-# Página ${pageIdx + 1}/${pages} • ${queue.length} canción(es) en cola`),
            );

            return container;
        };

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('queue_home').setLabel('Inicio').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('queue_prev').setLabel('Anterior').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('queue_next').setLabel('Siguiente').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('queue_close').setLabel('Cerrar').setStyle(ButtonStyle.Danger),
        );

        const components = [generateContainer(0)];
        if (queue.length > perPage) components.push(row);

        const channel = ctx.channel;
        const queueMsg = await channel.send({ components, flags: MessageFlags.IsComponentsV2 }).catch(() => null);
        if (!queueMsg) return;

        if (isSlash(ctx)) {
            await ctx.reply({ content: '📜 Acá tenés la cola.', flags: MessageFlags.Ephemeral }).catch(() => {});
        }

        if (queue.length > perPage) {
            const userId = isSlash(ctx) ? ctx.user.id : ctx.author.id;
            const authorName = isSlash(ctx) ? ctx.user.username : ctx.author.username;

            const collector = queueMsg.createMessageComponentCollector({
                filter: (b) => {
                    if (b.user.id === userId) return true;
                    b.reply({ content: `⚠️ Solo ${authorName} puede usar estos botones.`, flags: MessageFlags.Ephemeral }).catch(() => {});
                    return false;
                },
                idle: 30000,
            });

            collector.on('collect', async (button) => {
                if (!button.deferred) await button.deferUpdate().catch(() => {});

                if (button.customId === 'queue_prev') page = page > 0 ? page - 1 : pages - 1;
                else if (button.customId === 'queue_home') page = 0;
                else if (button.customId === 'queue_next') page = page + 1 < pages ? page + 1 : 0;
                else if (button.customId === 'queue_close') {
                    collector.stop();
                    return queueMsg.delete().catch(() => {});
                }

                await queueMsg.edit({ components: [generateContainer(page), row], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
            });

            collector.on('end', () => {
                queueMsg.edit({ components: [generateContainer(page)], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
            });
        }
    },
};
