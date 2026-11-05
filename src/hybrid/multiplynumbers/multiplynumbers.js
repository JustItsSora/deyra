const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('multiplynumbers')
        .setDescription('Multiplica una lista de números')
        .addStringOption(o => o.setName('numeros').setDescription('Ej: 2,3,4').setRequired(true)),

    name: 'multiplynumbers',
    aliases: ['multiplicar'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const raw = isSlash(ctx) ? ctx.options.getString('numeros') : args.join(' ');
        if (!raw) {
            return reply(ctx, { ...errorPanel('Faltan números', 'Especifica una lista de números separados por comas.'), ephemeral: true });
        }

        const numbers = raw.split(',').map(n => parseFloat(n.trim())).filter(n => !Number.isNaN(n));
        if (numbers.length === 0) {
            return reply(ctx, { ...errorPanel('Sin números válidos', 'No pude interpretar ningún número.'), ephemeral: true });
        }

        const result = numbers.reduce((a, b) => a * b, 1);
        return reply(ctx, infoPanel('Multiplicación', `${numbers.join(' × ')} = **${result}**`));
    },
};
