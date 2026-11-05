// src/hybrid/pfpgirl/pfpgirl.js
const {
    SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
    SeparatorSpacingSize, MediaGalleryBuilder, MediaGalleryItemBuilder,
} = require('discord.js');
const { isSlash } = require('../../lib/reply');
const { errorPanel } = require('../../lib/panel');
const { createPaginationSession } = require('../../lib/pagination');
const { fetchPfps } = require('../../lib/pfpApi');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder().setName('pfpgirl').setDescription('Muestra fotos de perfil de chicas, con navegación entre varias'),

    name: 'pfpgirl',
    aliases: ['pfpfemale', 'girlpfp'],
    category: 'diversión',
    cooldownMs: 3000,

    async execute(ctx) {
        let pfps;
        try {
            pfps = await fetchPfps('female');
        } catch (_) {
            pfps = [];
        }

        if (!pfps || pfps.length === 0) {
            const payload = { ...errorPanel('Sin resultados', 'No hay fotos de perfil disponibles ahora mismo. Probá de nuevo más tarde.'), ephemeral: true };
            return (isSlash(ctx) ? ctx.reply(payload) : ctx.reply(payload)).catch(() => {});
        }

        const userId = isSlash(ctx) ? ctx.user.id : ctx.author.id;

        const pagination = createPaginationSession({
            interactionOrMessage: ctx,
            pages: pfps,
            userId,
            renderPage: (pageIndex, imageUrl) => new ContainerBuilder().setAccentColor(config.COLORS.PRIMARY)
                .addTextDisplayComponents(new TextDisplayBuilder().setContent('### 🖼️ Fotos de perfil — Chicas'))
                .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
                .addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(imageUrl).setDescription('Foto de perfil')))
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${pageIndex + 1}/${pfps.length}`)),
        });

        await pagination.renderInitial();
    },
};
