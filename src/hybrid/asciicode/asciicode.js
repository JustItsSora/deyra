const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('asciicode')
        .setDescription('Muestra el código ASCII/Unicode de un carácter')
        .addStringOption(o => o.setName('caracter').setDescription('Un solo carácter').setRequired(true)),

    name: 'asciicode',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const char = isSlash(ctx) ? ctx.options.getString('caracter') : args[0];
        if (!char || [...char].length !== 1) {
            return reply(ctx, { ...errorPanel('Valor inválido', 'Especifica exactamente un carácter.'), ephemeral: true });
        }

        const code = char.codePointAt(0);
        return reply(ctx, infoPanel('Código de carácter', `**"${char}"** = **${code}** (decimal) = **0x${code.toString(16).toUpperCase()}** (hex)`));
    },
};
