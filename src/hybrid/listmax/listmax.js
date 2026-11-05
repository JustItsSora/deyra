const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listmax')
        .setDescription('Encuentra el número más alto de una lista')
        .addStringOption(o => o.setName('numeros').setDescription('Números separados por comas').setRequired(true)),

    name: 'listmax',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const raw = isSlash(ctx) ? ctx.options.getString('numeros') : args.join(' ');
        const numbers = raw?.split(',').map(n => parseFloat(n.trim())).filter(n => !Number.isNaN(n)) || [];

        if (numbers.length === 0) {
            return reply(ctx, { ...errorPanel('Sin números válidos', 'Especifica números separados por comas.'), ephemeral: true });
        }

        return reply(ctx, infoPanel('Número máximo', `**${Math.max(...numbers)}**`));
    },
};
