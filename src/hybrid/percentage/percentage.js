const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('percentage')
        .setDescription('Calcula qué porcentaje es un número de otro')
        .addNumberOption(o => o.setName('parte').setDescription('El número parcial').setRequired(true))
        .addNumberOption(o => o.setName('total').setDescription('El número total').setRequired(true)),

    name: 'percentage',
    aliases: ['porcentaje'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        let part, total;
        if (isSlash(ctx)) {
            part = ctx.options.getNumber('parte');
            total = ctx.options.getNumber('total');
        } else {
            part = parseFloat(args[0]);
            total = parseFloat(args[1]);
        }

        if (Number.isNaN(part) || Number.isNaN(total) || total === 0) {
            return reply(ctx, { ...errorPanel('Valores inválidos', 'Especifica dos números válidos (el total no puede ser 0).'), ephemeral: true });
        }

        const result = (part / total) * 100;
        return reply(ctx, infoPanel('Cálculo de porcentaje', `**${part}** es el **${result.toFixed(2)}%** de **${total}**.`));
    },
};
