const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('findduplicate')
        .setDescription('Encuentra elementos duplicados en una lista')
        .addStringOption(o => o.setName('elementos').setDescription('Elementos separados por comas').setRequired(true)),

    name: 'findduplicate',
    aliases: ['buscarduplicados'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const raw = isSlash(ctx) ? ctx.options.getString('elementos') : args.join(' ');
        if (!raw) {
            return reply(ctx, { ...errorPanel('Faltan elementos', 'Especifica elementos separados por comas.'), ephemeral: true });
        }

        const items = raw.split(',').map(i => i.trim()).filter(Boolean);
        const counts = items.reduce((acc, i) => { acc[i] = (acc[i] || 0) + 1; return acc; }, {});
        const duplicates = Object.entries(counts).filter(([, c]) => c > 1);

        if (duplicates.length === 0) {
            return reply(ctx, infoPanel('Sin duplicados', 'No hay elementos duplicados en la lista.'));
        }

        const lines = duplicates.map(([item, count]) => `**${item}** — ${count} veces`);
        return reply(ctx, infoPanel('Duplicados encontrados', undefined, { lines }));
    },
};
