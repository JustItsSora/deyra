// src/hybrid/grab/grab.js
const {
    SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
    SectionBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags,
} = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { successPanel, warningPanel } = require('../../lib/panel');
const { requireMusic, requirePlayer } = require('../../music/lib/musicChecks');
const config = require('../../config');

function formatDuration(ms) {
    if (!ms || ms <= 0) return 'En vivo';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

function cleanAuthorName(author) {
    return (author || 'Artista desconocido').replace(/\s*-\s*Topic\s*$/i, '').trim();
}

module.exports = {
    data: new SlashCommandBuilder().setName('grab').setDescription('Te envía por DM los detalles de la canción que está sonando'),

    name: 'grab',
    category: 'música',
    cooldownMs: 3000,

    async execute(ctx) {
        if (!requireMusic(ctx)) return;
        const player = requirePlayer(ctx);
        if (!player) return;

        if (!player.queue.current) {
            return reply(ctx, { ...warningPanel('Nada sonando', 'Poné una canción primero.'), ephemeral: true });
        }

        const song = player.queue.current;
        const user = isSlash(ctx) ? ctx.user : ctx.author;

        await reply(ctx, successPanel('Enviado por DM', 'Te mandé los detalles de la canción actual a tus mensajes directos.'));

        const urlButton = new ButtonBuilder().setLabel('Enlace de la canción').setStyle(ButtonStyle.Link).setURL(song.uri);
        const row = new ActionRowBuilder().addComponents(urlButton);

        const section = new SectionBuilder().addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`**Duración:** \`${formatDuration(song.length)}\``),
            new TextDisplayBuilder().setContent(`**Artista:** \`${cleanAuthorName(song.author)}\``),
        );

        if (song.thumbnail || song.artworkUrl) {
            section.setThumbnailAccessory((t) => t.setURL(song.thumbnail || song.artworkUrl));
        }

        const dmContainer = new ContainerBuilder().setAccentColor(config.COLORS.PRIMARY)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### 🎵 [${song.title}](${song.uri})`))
            .addSeparatorComponents(new SeparatorBuilder())
            .addSectionComponents(section)
            .addSeparatorComponents(new SeparatorBuilder())
            .addActionRowComponents(row);

        return user.send({ components: [dmContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    },
};
