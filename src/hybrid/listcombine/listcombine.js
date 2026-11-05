const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listcombine')
        .setDescription('Combina dos listas en una sola, quitando duplicados')
        .addStringOption(o => o.setName('lista1').setDescription('Primera lista, separada por comas').setRequired(true))
        .addStringOption(o => o.setName('lista2').setDescription('Segunda lista, separada por comas').setRequired(true)),

    name: 'listcombine',
    aliases: ['combinarlistas'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        let raw1, raw2;
        if (isSlash(ctx)) {
            raw1 = ctx.options.getString('lista1');
            raw2 = ctx.options.getString('lista2');
        } else {
            [raw1, raw2] = args.join(' ').split('|').map(s => s?.trim());
        }

        if (!raw1 || !raw2) {
            return reply(ctx, { ...errorPanel('Faltan listas', 'Especifica dos listas separadas por comas.'), ephemeral: true });
        }

        const combined = [...new Set([...raw1.split(','), ...raw2.split(',')].map(i => i.trim()).filter(Boolean))];
        return reply(ctx, infoPanel('Listas combinadas', combined.join(', ')));
    },
};
