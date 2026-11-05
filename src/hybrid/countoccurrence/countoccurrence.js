const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('countoccurrence')
        .setDescription('Cuenta cuántas veces aparece una palabra en un texto')
        .addStringOption(o => o.setName('texto').setDescription('Texto donde buscar').setRequired(true))
        .addStringOption(o => o.setName('palabra').setDescription('Palabra a buscar').setRequired(true)),

    name: 'countoccurrence',
    aliases: ['contarocurrencias'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        let text, word;
        if (isSlash(ctx)) {
            text = ctx.options.getString('texto');
            word = ctx.options.getString('palabra');
        } else {
            word = args[args.length - 1];
            text = args.slice(0, -1).join(' ');
        }

        if (!text || !word) {
            return reply(ctx, { ...errorPanel('Datos inválidos', 'Especifica un texto y una palabra a buscar.'), ephemeral: true });
        }

        const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        const matches = text.match(regex) || [];

        return reply(ctx, infoPanel('Conteo de ocurrencias', `"${word}" aparece **${matches.length}** vez/veces en el texto.`));
    },
};
