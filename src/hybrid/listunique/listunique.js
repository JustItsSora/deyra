const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listunique')
        .setDescription('Quita elementos duplicados de una lista')
        .addStringOption(o => o.setName('elementos').setDescription('Elementos separados por comas').setRequired(true)),

    name: 'listunique',
    aliases: ['unicos'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const raw = isSlash(ctx) ? ctx.options.getString('elementos') : args.join(' ');
        if (!raw) {
            return reply(ctx, { ...errorPanel('Faltan elementos', 'Especifica elementos separados por comas.'), ephemeral: true });
        }

        const items = raw.split(',').map(i => i.trim()).filter(Boolean);
        const unique = [...new Set(items)];

        return reply(ctx, infoPanel('Lista sin duplicados', `${unique.join(', ')}\n\n-# ${items.length - unique.length} duplicado(s) removido(s).`));
    },
};
