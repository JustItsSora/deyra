const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

function gcd(a, b) {
    return b === 0 ? a : gcd(b, a % b);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lcm')
        .setDescription('Calcula el mínimo común múltiplo de dos números')
        .addIntegerOption(o => o.setName('a').setDescription('Primer número').setRequired(true))
        .addIntegerOption(o => o.setName('b').setDescription('Segundo número').setRequired(true)),

    name: 'lcm',
    aliases: ['mcm'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        let a, b;
        if (isSlash(ctx)) {
            a = ctx.options.getInteger('a');
            b = ctx.options.getInteger('b');
        } else {
            a = parseInt(args[0], 10);
            b = parseInt(args[1], 10);
        }

        if (!a || !b) {
            return reply(ctx, { ...errorPanel('Valores inválidos', 'Especifica dos números enteros distintos de cero.'), ephemeral: true });
        }

        const result = Math.abs(a * b) / gcd(Math.abs(a), Math.abs(b));
        return reply(ctx, infoPanel('Mínimo Común Múltiplo', `MCM(${a}, ${b}) = **${result}**`));
    },
};
