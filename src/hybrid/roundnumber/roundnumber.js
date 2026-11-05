const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roundnumber')
        .setDescription('Redondea un número a N decimales')
        .addNumberOption(o => o.setName('numero').setDescription('El número').setRequired(true))
        .addIntegerOption(o => o.setName('decimales').setDescription('Cantidad de decimales (default 0)').setMinValue(0).setMaxValue(10).setRequired(false)),

    name: 'roundnumber',
    aliases: ['redondear'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        let n, decimals;
        if (isSlash(ctx)) {
            n = ctx.options.getNumber('numero');
            decimals = ctx.options.getInteger('decimales') ?? 0;
        } else {
            n = parseFloat(args[0]);
            decimals = parseInt(args[1], 10) || 0;
        }

        if (Number.isNaN(n)) {
            return reply(ctx, { ...errorPanel('Valor inválido', 'Especifica un número válido.'), ephemeral: true });
        }

        const rounded = Number(n.toFixed(decimals));
        return reply(ctx, infoPanel('Número redondeado', `**${n}** redondeado a ${decimals} decimal(es) = **${rounded}**`));
    },
};
