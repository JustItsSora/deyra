const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('subtractnumbers')
        .setDescription('Resta una lista de números en orden')
        .addStringOption(o => o.setName('numeros').setDescription('Ej: 100,20,5').setRequired(true)),

    name: 'subtractnumbers',
    aliases: ['restar'],
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

        const result = numbers.reduce((a, b) => a - b);
        return reply(ctx, infoPanel('Resta', `${numbers.join(' - ')} = **${result}**`));
    },
};
