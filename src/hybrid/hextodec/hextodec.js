const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hextodec')
        .setDescription('Convierte un número hexadecimal a decimal')
        .addStringOption(o => o.setName('hex').setDescription('Número hexadecimal (sin 0x)').setRequired(true)),

    name: 'hextodec',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const hex = (isSlash(ctx) ? ctx.options.getString('hex') : args[0])?.replace(/^0x/i, '');
        if (!hex || !/^[0-9a-fA-F]+$/.test(hex)) {
            return reply(ctx, { ...errorPanel('Valor inválido', 'Especifica un número hexadecimal válido.'), ephemeral: true });
        }

        const dec = parseInt(hex, 16);
        return reply(ctx, infoPanel('Hex a Decimal', `**0x${hex}** = **${dec}**`));
    },
};
