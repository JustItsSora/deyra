const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('splitbill')
        .setDescription('Divide una cuenta entre varias personas')
        .addNumberOption(o => o.setName('total').setDescription('Total de la cuenta').setRequired(true))
        .addIntegerOption(o => o.setName('personas').setDescription('Número de personas').setMinValue(1).setRequired(true)),

    name: 'splitbill',
    aliases: ['dividir'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        let total, people;
        if (isSlash(ctx)) {
            total = ctx.options.getNumber('total');
            people = ctx.options.getInteger('personas');
        } else {
            total = parseFloat(args[0]);
            people = parseInt(args[1], 10);
        }

        if (!total || total <= 0 || !people || people <= 0) {
            return reply(ctx, { ...errorPanel('Valores inválidos', 'Especifica un total y número de personas válidos.'), ephemeral: true });
        }

        const perPerson = total / people;
        return reply(ctx, infoPanel('🧾 División de cuenta', `**Total:** $${total.toFixed(2)}\n**Personas:** ${people}\n**Cada uno paga:** $${perPerson.toFixed(2)}`));
    },
};
