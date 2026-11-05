const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('textrepeat')
        .setDescription('Repite un texto N veces')
        .addStringOption(o => o.setName('texto').setDescription('Texto a repetir').setRequired(true))
        .addIntegerOption(o => o.setName('veces').setDescription('Cuántas veces (máx 20)').setMinValue(1).setMaxValue(20).setRequired(true)),

    name: 'textrepeat',
    aliases: ['repetir'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        let text, times;
        if (isSlash(ctx)) {
            text = ctx.options.getString('texto');
            times = ctx.options.getInteger('veces');
        } else {
            times = parseInt(args[args.length - 1], 10);
            text = args.slice(0, -1).join(' ');
        }

        if (!text || !times) {
            return reply(ctx, { ...errorPanel('Datos inválidos', 'Especifica un texto y cuántas veces repetirlo.'), ephemeral: true });
        }

        const result = Array(Math.min(times, 20)).fill(text).join(' ');
        return reply(ctx, infoPanel('Texto repetido', result.slice(0, 1900)));
    },
};
