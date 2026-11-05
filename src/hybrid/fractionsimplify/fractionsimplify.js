const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

function gcd(a, b) {
    return b === 0 ? a : gcd(b, a % b);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fractionsimplify')
        .setDescription('Simplifica una fracción a su forma más reducida')
        .addIntegerOption(o => o.setName('numerador').setDescription('Numerador').setRequired(true))
        .addIntegerOption(o => o.setName('denominador').setDescription('Denominador').setRequired(true)),

    name: 'fractionsimplify',
    aliases: ['simplificarfraccion'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        let num, den;
        if (isSlash(ctx)) {
            num = ctx.options.getInteger('numerador');
            den = ctx.options.getInteger('denominador');
        } else {
            num = parseInt(args[0], 10);
            den = parseInt(args[1], 10);
        }

        if (Number.isNaN(num) || !den) {
            return reply(ctx, { ...errorPanel('Datos inválidos', 'Especifica numerador y un denominador distinto de cero.'), ephemeral: true });
        }

        const divisor = gcd(Math.abs(num), Math.abs(den));
        const simplifiedNum = num / divisor;
        const simplifiedDen = den / divisor;

        return reply(ctx, infoPanel('Fracción simplificada', `**${num}/${den}** = **${simplifiedNum}/${simplifiedDen}**`));
    },
};
