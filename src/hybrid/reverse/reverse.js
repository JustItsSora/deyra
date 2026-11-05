const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reverse')
        .setDescription('Invierte un texto')
        .addStringOption(o => o.setName('texto').setDescription('Texto a invertir').setRequired(true)),

    name: 'reverse',
    aliases: ['invertir'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const text = isSlash(ctx) ? ctx.options.getString('texto') : args.join(' ');
        if (!text) {
            return reply(ctx, { ...errorPanel('Falta el texto', 'Especifica qué quieres invertir.'), ephemeral: true });
        }

        const reversed = [...text].reverse().join('');
        return reply(ctx, infoPanel('🔄 Texto invertido', reversed));
    },
};
