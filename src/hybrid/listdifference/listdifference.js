const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listdifference')
        .setDescription('Encuentra los elementos que están en la primera lista pero no en la segunda')
        .addStringOption(o => o.setName('lista1').setDescription('Primera lista, separada por comas').setRequired(true))
        .addStringOption(o => o.setName('lista2').setDescription('Segunda lista, separada por comas').setRequired(true)),

    name: 'listdifference',
    aliases: ['diferencia'],
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

        const list1 = raw1.split(',').map(i => i.trim());
        const list2 = raw2.split(',').map(i => i.trim());
        const diff = list1.filter(i => !list2.includes(i));

        if (diff.length === 0) {
            return reply(ctx, infoPanel('Diferencia', 'Todos los elementos de la primera lista están también en la segunda.'));
        }

        return reply(ctx, infoPanel('Elementos exclusivos de la lista 1', diff.join(', ')));
    },
};
