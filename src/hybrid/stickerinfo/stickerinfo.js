const { SlashCommandBuilder, MessageFlags, ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { errorPanel } = require('../../lib/panel');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stickerinfo')
        .setDescription('Muestra información del sticker en tu último mensaje enviado en este canal'),

    name: 'stickerinfo',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx) {
        const messages = await ctx.channel.messages.fetch({ limit: 20 });
        const withSticker = [...messages.values()].find(m => m.stickers.size > 0);

        if (!withSticker) {
            return reply(ctx, { ...errorPanel('No encontrado', 'No encontré ningún sticker en los últimos 20 mensajes de este canal.'), ephemeral: true });
        }

        const sticker = withSticker.stickers.first();
        const container = new ContainerBuilder().setAccentColor(config.COLORS.PRIMARY);
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## Sticker: ${sticker.name}\n**ID:** ${sticker.id}\n**Descripción:** ${sticker.description || 'Ninguna'}`));
        container.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(sticker.url)));

        return reply(ctx, { components: [container], flags: MessageFlags.IsComponentsV2 });
    },
};
