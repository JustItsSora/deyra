const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tip')
        .setDescription('Calcula la propina de una cuenta')
        .addNumberOption(o => o.setName('total').setDescription('Total de la cuenta').setRequired(true))
        .addNumberOption(o => o.setName('porcentaje').setDescription('Porcentaje de propina (default 15%)').setRequired(false)),

    name: 'tip',
    aliases: ['propina'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        let total, percent;
        if (isSlash(ctx)) {
            total = ctx.options.getNumber('total');
            percent = ctx.options.getNumber('porcentaje') || 15;
        } else {
            total = parseFloat(args[0]);
            percent = parseFloat(args[1]) || 15;
        }

        if (!total || total <= 0) {
            return reply(ctx, { ...errorPanel('Valor inválido', 'Especifica el total de la cuenta.'), ephemeral: true });
        }

        const tip = total * (percent / 100);
        const finalTotal = total + tip;

        return reply(ctx, infoPanel('💵 Cálculo de propina', `**Cuenta:** $${total.toFixed(2)}\n**Propina (${percent}%):** $${tip.toFixed(2)}\n**Total con propina:** $${finalTotal.toFixed(2)}`));
    },
};
