const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vowelcount')
        .setDescription('Cuenta las vocales de un texto')
        .addStringOption(o => o.setName('texto').setDescription('Texto a analizar').setRequired(true)),

    name: 'vowelcount',
    aliases: ['contarvocales'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const text = isSlash(ctx) ? ctx.options.getString('texto') : args.join(' ');
        if (!text) {
            return reply(ctx, { ...errorPanel('Falta el texto', 'Especifica el texto a analizar.'), ephemeral: true });
        }

        const matches = text.toLowerCase().match(/[aeiouáéíóú]/g) || [];
        const counts = matches.reduce((acc, v) => {
            const base = v.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            acc[base] = (acc[base] || 0) + 1;
            return acc;
        }, {});

        const lines = Object.entries(counts).map(([v, c]) => `**${v}:** ${c}`);
        return reply(ctx, infoPanel('Conteo de vocales', `Total: **${matches.length}**`, { lines }));
    },
};
