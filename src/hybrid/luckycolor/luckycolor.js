const { SlashCommandBuilder, MessageFlags, ContainerBuilder, TextDisplayBuilder } = require('discord.js');
const { reply, getUserId } = require('../../lib/reply');
const crypto = require('crypto');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('luckycolor')
        .setDescription('Descubre tu color de la suerte del día'),

    name: 'luckycolor',
    aliases: ['colorsuerte'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx) {
        const userId = getUserId(ctx);
        const today = new Date().toISOString().slice(0, 10);
        const hash = crypto.createHash('md5').update(`${userId}-color-${today}`).digest('hex');
        const colorInt = parseInt(hash.slice(0, 6), 16);
        const hex = `#${colorInt.toString(16).padStart(6, '0').toUpperCase()}`;

        const container = new ContainerBuilder().setAccentColor(colorInt);
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## 🎨 Color de la suerte\nTu color de hoy es: **${hex}**`));

        return reply(ctx, { components: [container], flags: MessageFlags.IsComponentsV2 });
    },
};
