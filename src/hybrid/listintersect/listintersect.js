const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listintersect')
        .setDescription('Encuentra los elementos comunes entre dos listas')
        .addStringOption(o => o.setName('lista1').setDescription('Primera lista, separada por comas').setRequired(true))
        .addStringOption(o => o.setName('lista2').setDescription('Segunda lista, separada por comas').setRequired(true)),

    name: 'listintersect',
    aliases: ['interseccion'],
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
        const common = list1.filter(i => list2.includes(i));

        if (common.length === 0) {
            return reply(ctx, infoPanel('Intersección', 'No hay elementos en común entre las dos listas.'));
        }

        return reply(ctx, infoPanel('Elementos en común', common.join(', ')));
    },
};
