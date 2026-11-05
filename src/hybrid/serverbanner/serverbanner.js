const { SlashCommandBuilder, MessageFlags, ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { errorPanel } = require('../../lib/panel');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverbanner')
        .setDescription('Muestra el banner del servidor'),

    name: 'serverbanner',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx) {
        const url = ctx.guild.bannerURL({ size: 1024, extension: 'png' });
        if (!url) {
            return reply(ctx, { ...errorPanel('Sin banner', 'Este servidor no tiene un banner configurado.'), ephemeral: true });
        }

        const container = new ContainerBuilder().setAccentColor(config.COLORS.PRIMARY);
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## Banner de ${ctx.guild.name}`));
        container.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(url)));

        return reply(ctx, { components: [container], flags: MessageFlags.IsComponentsV2 });
    },
};
