const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listsort')
        .setDescription('Ordena una lista de elementos alfabéticamente o numéricamente')
        .addStringOption(o => o.setName('elementos').setDescription('Elementos separados por comas').setRequired(true))
        .addStringOption(o => o.setName('orden').setDescription('Orden').setRequired(false).addChoices({ name: 'Ascendente', value: 'asc' }, { name: 'Descendente', value: 'desc' })),

    name: 'listsort',
    aliases: ['ordenar'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        let raw, order;
        if (isSlash(ctx)) {
            raw = ctx.options.getString('elementos');
            order = ctx.options.getString('orden') || 'asc';
        } else {
            raw = args.join(' ');
            order = 'asc';
        }

        if (!raw) {
            return reply(ctx, { ...errorPanel('Faltan elementos', 'Especifica elementos separados por comas.'), ephemeral: true });
        }

        const items = raw.split(',').map(i => i.trim()).filter(Boolean);
        const allNumbers = items.every(i => !Number.isNaN(parseFloat(i)));

        const sorted = allNumbers
            ? items.map(Number).sort((a, b) => (order === 'asc' ? a - b : b - a))
            : items.sort((a, b) => (order === 'asc' ? a.localeCompare(b) : b.localeCompare(a)));

        return reply(ctx, infoPanel('Lista ordenada', sorted.join(', ')));
    },
};
