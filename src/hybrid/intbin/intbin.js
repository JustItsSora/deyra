// src/hybrid/intbin/intbin.js
const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('intbin')
        .setDescription('Convierte un número entero a binario')
        .addIntegerOption((o) => o.setName('numero').setDescription('Número entero').setMinValue(0).setRequired(true)),

    name: 'intbin',
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const number = isSlash(ctx) ? ctx.options.getInteger('numero') : parseInt(args[0], 10);

        if (Number.isNaN(number)) {
            return reply(ctx, { ...errorPanel('Valor inválido', 'Especificá un número válido.'), ephemeral: true });
        }
        if (number < 0) {
            return reply(ctx, { ...errorPanel('Valor inválido', 'El número no puede ser negativo.'), ephemeral: true });
        }

        const binary = number.toString(2);
        return reply(ctx, infoPanel('Entero a binario', `**${number}** = **${binary}**`));
    },
};
