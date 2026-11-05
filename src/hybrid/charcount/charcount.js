const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('charcount')
        .setDescription('Cuenta los caracteres de un texto')
        .addStringOption(o => o.setName('texto').setDescription('Texto a analizar').setRequired(true)),

    name: 'charcount',
    aliases: ['contarcaracteres'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const text = isSlash(ctx) ? ctx.options.getString('texto') : args.join(' ');
        if (!text) {
            return reply(ctx, { ...errorPanel('Falta el texto', 'Especifica el texto a analizar.'), ephemeral: true });
        }

        const withSpaces = text.length;
        const withoutSpaces = text.replace(/\s/g, '').length;

        return reply(ctx, infoPanel('Conteo de caracteres', `**Con espacios:** ${withSpaces}\n**Sin espacios:** ${withoutSpaces}`));
    },
};
