const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

const NUMERALS = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
    [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
];

function toRoman(num) {
    let result = '';
    for (const [value, symbol] of NUMERALS) {
        while (num >= value) {
            result += symbol;
            num -= value;
        }
    }
    return result;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('romannumeral')
        .setDescription('Convierte un número a numeral romano')
        .addIntegerOption(o => o.setName('numero').setDescription('Número entre 1 y 3999').setMinValue(1).setMaxValue(3999).setRequired(true)),

    name: 'romannumeral',
    aliases: ['numeroromano'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const n = isSlash(ctx) ? ctx.options.getInteger('numero') : parseInt(args[0], 10);
        if (Number.isNaN(n) || n < 1 || n > 3999) {
            return reply(ctx, { ...errorPanel('Valor inválido', 'Especifica un número entre 1 y 3999.'), ephemeral: true });
        }

        return reply(ctx, infoPanel('Numeral romano', `**${n}** = **${toRoman(n)}**`));
    },
};
