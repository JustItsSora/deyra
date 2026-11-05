// src/hybrid/dechex/dechex.js
const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dechex')
        .setDescription('Convierte un número decimal a hexadecimal')
        .addIntegerOption((o) => o.setName('decimal').setDescription('Número decimal').setMinValue(0).setRequired(true)),

    name: 'dechex',
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const decimal = isSlash(ctx) ? ctx.options.getInteger('decimal') : parseInt(args[0], 10);

        if (Number.isNaN(decimal)) {
            return reply(ctx, { ...errorPanel('Valor inválido', 'Especificá un número válido.'), ephemeral: true });
        }
        if (decimal < 0) {
            return reply(ctx, { ...errorPanel('Valor inválido', 'El valor decimal no puede ser negativo.'), ephemeral: true });
        }

        const hex = decimal.toString(16).toUpperCase();
        return reply(ctx, infoPanel('Decimal a hexadecimal', `**${decimal}** = **0x${hex}**`));
    },
};
