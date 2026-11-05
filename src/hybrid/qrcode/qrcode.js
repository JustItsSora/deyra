const { SlashCommandBuilder, MessageFlags, ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { errorPanel } = require('../../lib/panel');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('qrcode')
        .setDescription('Genera un código QR a partir de texto o un enlace')
        .addStringOption(o => o.setName('contenido').setDescription('Texto o URL').setRequired(true)),

    name: 'qrcode',
    aliases: ['qr'],
    category: 'utilidad',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        const content = isSlash(ctx) ? ctx.options.getString('contenido') : args.join(' ');
        if (!content) {
            return reply(ctx, { ...errorPanel('Falta el contenido', 'Especifica el texto o enlace a convertir.'), ephemeral: true });
        }

        // goqr.me — generador de QR gratuito, sin API key.
        const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(content)}`;

        const container = new ContainerBuilder().setAccentColor(config.COLORS.PRIMARY);
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## 📱 Código QR generado'));
        container.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(url)));

        return reply(ctx, { components: [container], flags: MessageFlags.IsComponentsV2 });
    },
};
