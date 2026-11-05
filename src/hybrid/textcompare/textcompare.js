const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('textcompare')
        .setDescription('Compara dos textos y muestra si son idénticos')
        .addStringOption(o => o.setName('texto1').setDescription('Primer texto').setRequired(true))
        .addStringOption(o => o.setName('texto2').setDescription('Segundo texto').setRequired(true)),

    name: 'textcompare',
    aliases: ['compararTexto'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        let a, b;
        if (isSlash(ctx)) {
            a = ctx.options.getString('texto1');
            b = ctx.options.getString('texto2');
        } else {
            [a, b] = args.join(' ').split('|').map(s => s?.trim());
        }

        if (!a || !b) {
            return reply(ctx, { ...errorPanel('Faltan textos', 'Especifica dos textos a comparar.'), ephemeral: true });
        }

        const identical = a === b;
        const identicalIgnoreCase = a.toLowerCase() === b.toLowerCase();

        return reply(ctx, infoPanel('Comparación de textos', `**Idénticos (exacto):** ${identical ? 'Sí' : 'No'}\n**Idénticos (ignorando mayúsculas):** ${identicalIgnoreCase ? 'Sí' : 'No'}`));
    },
};
