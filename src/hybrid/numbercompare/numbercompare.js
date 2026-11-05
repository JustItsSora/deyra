const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('numbercompare')
        .setDescription('Compara dos números y muestra cuál es mayor')
        .addNumberOption(o => o.setName('numero1').setDescription('Primer número').setRequired(true))
        .addNumberOption(o => o.setName('numero2').setDescription('Segundo número').setRequired(true)),

    name: 'numbercompare',
    aliases: ['comparar'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        let a, b;
        if (isSlash(ctx)) {
            a = ctx.options.getNumber('numero1');
            b = ctx.options.getNumber('numero2');
        } else {
            a = parseFloat(args[0]);
            b = parseFloat(args[1]);
        }

        if (Number.isNaN(a) || Number.isNaN(b)) {
            return reply(ctx, { ...errorPanel('Valores inválidos', 'Especifica dos números válidos.'), ephemeral: true });
        }

        const result = a > b ? `**${a}** es mayor que **${b}**` : a < b ? `**${b}** es mayor que **${a}**` : `**${a}** y **${b}** son iguales`;
        return reply(ctx, infoPanel('Comparación de números', result));
    },
};
