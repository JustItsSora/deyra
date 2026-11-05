const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('percentof')
        .setDescription('Calcula el X% de un número')
        .addNumberOption(o => o.setName('porcentaje').setDescription('El porcentaje').setRequired(true))
        .addNumberOption(o => o.setName('numero').setDescription('El número base').setRequired(true)),

    name: 'percentof',
    aliases: ['porcentajede'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        let percent, number;
        if (isSlash(ctx)) {
            percent = ctx.options.getNumber('porcentaje');
            number = ctx.options.getNumber('numero');
        } else {
            percent = parseFloat(args[0]);
            number = parseFloat(args[1]);
        }

        if (Number.isNaN(percent) || Number.isNaN(number)) {
            return reply(ctx, { ...errorPanel('Valores inválidos', 'Especifica un porcentaje y un número válidos.'), ephemeral: true });
        }

        const result = (percent / 100) * number;
        return reply(ctx, infoPanel('Cálculo de porcentaje', `El **${percent}%** de **${number}** es **${result}**`));
    },
};
