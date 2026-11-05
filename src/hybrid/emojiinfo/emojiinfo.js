const { SlashCommandBuilder, MessageFlags, ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { errorPanel } = require('../../lib/panel');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('emojiinfo')
        .setDescription('Muestra información de un emoji personalizado')
        .addStringOption(o => o.setName('emoji').setDescription('El emoji (pega el emoji directamente)').setRequired(true)),

    name: 'emojiinfo',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const raw = isSlash(ctx) ? ctx.options.getString('emoji') : args[0];
        const match = raw?.match(/<(a)?:(\w+):(\d+)>/);

        if (!match) {
            return reply(ctx, { ...errorPanel('Emoji inválido', 'Debe ser un emoji personalizado de Discord (no unicode).'), ephemeral: true });
        }

        const [, animated, name, id] = match;
        const url = `https://cdn.discordapp.com/emojis/${id}.${animated ? 'gif' : 'png'}`;

        const container = new ContainerBuilder().setAccentColor(config.COLORS.PRIMARY);
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## Emoji: ${name}\n**ID:** ${id}\n**Animado:** ${animated ? 'Sí' : 'No'}`));
        container.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(url)));

        return reply(ctx, { components: [container], flags: MessageFlags.IsComponentsV2 });
    },
};
