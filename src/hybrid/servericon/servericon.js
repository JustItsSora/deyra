const { SlashCommandBuilder, MessageFlags, ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { errorPanel } = require('../../lib/panel');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('servericon')
        .setDescription('Muestra el ícono del servidor en tamaño completo'),

    name: 'servericon',
    aliases: ['icon'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx) {
        const guild = ctx.guild;
        const url = guild.iconURL({ size: 1024, extension: 'png' });

        if (!url) {
            return reply(ctx, { ...errorPanel('Sin ícono', 'Este servidor no tiene un ícono configurado.'), ephemeral: true });
        }

        const container = new ContainerBuilder().setAccentColor(config.COLORS.PRIMARY);
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## Ícono de ${guild.name}`));
        container.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(url)));

        return reply(ctx, { components: [container], flags: MessageFlags.IsComponentsV2 });
    },
};
