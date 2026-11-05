const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addnumbers')
        .setDescription('Suma una lista de números separados por comas')
        .addStringOption(o => o.setName('numeros').setDescription('Ej: 4,8,15,16,23,42').setRequired(true)),

    name: 'addnumbers',
    aliases: ['sumar'],
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

        const sum = numbers.reduce((a, b) => a + b, 0);
        return reply(ctx, infoPanel('Suma', `${numbers.join(' + ')} = **${sum}**`));
    },
};
