const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dividenumbers')
        .setDescription('Divide una lista de números en orden')
        .addStringOption(o => o.setName('numeros').setDescription('Ej: 100,5,2').setRequired(true)),

    name: 'dividenumbers',
    aliases: ['dividir2'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const raw = isSlash(ctx) ? ctx.options.getString('numeros') : args.join(' ');
        if (!raw) {
            return reply(ctx, { ...errorPanel('Faltan números', 'Especifica una lista de números separados por comas.'), ephemeral: true });
        }

        const numbers = raw.split(',').map(n => parseFloat(n.trim())).filter(n => !Number.isNaN(n));
        if (numbers.length < 2) {
            return reply(ctx, { ...errorPanel('Faltan números', 'Especifica al menos dos números.'), ephemeral: true });
        }
        if (numbers.slice(1).includes(0)) {
            return reply(ctx, { ...errorPanel('División por cero', 'No se puede dividir entre cero.'), ephemeral: true });
        }

        const result = numbers.reduce((a, b) => a / b);
        return reply(ctx, infoPanel('División', `${numbers.join(' ÷ ')} = **${result.toFixed(4)}**`));
    },
};
