const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('emojirain')
        .setDescription('Genera una "lluvia" de un emoji repetido')
        .addStringOption(o => o.setName('emoji').setDescription('El emoji a repetir').setRequired(true))
        .addIntegerOption(o => o.setName('cantidad').setDescription('Cantidad de líneas (1-10)').setMinValue(1).setMaxValue(10).setRequired(false)),

    name: 'emojirain',
    aliases: [],
    category: 'diversión',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        let emoji, count;
        if (isSlash(ctx)) {
            emoji = ctx.options.getString('emoji');
            count = ctx.options.getInteger('cantidad') || 5;
        } else {
            emoji = args[0];
            count = parseInt(args[1], 10) || 5;
        }

        if (!emoji) {
            return reply(ctx, { ...errorPanel('Falta el emoji', 'Especifica un emoji.'), ephemeral: true });
        }

        const lines = Array.from({ length: Math.min(count, 10) }, (_, i) => emoji.repeat(i + 1));
        return reply(ctx, { content: lines.join('\n') });
    },
};
