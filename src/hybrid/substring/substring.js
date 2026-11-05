const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('substring')
        .setDescription('Extrae una parte de un texto entre dos posiciones')
        .addStringOption(o => o.setName('texto').setDescription('El texto').setRequired(true))
        .addIntegerOption(o => o.setName('inicio').setDescription('Posición inicial (empieza en 1)').setMinValue(1).setRequired(true))
        .addIntegerOption(o => o.setName('fin').setDescription('Posición final').setMinValue(1).setRequired(true)),

    name: 'substring',
    aliases: ['subtexto'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        let text, start, end;
        if (isSlash(ctx)) {
            text = ctx.options.getString('texto');
            start = ctx.options.getInteger('inicio');
            end = ctx.options.getInteger('fin');
        } else {
            end = parseInt(args[args.length - 1], 10);
            start = parseInt(args[args.length - 2], 10);
            text = args.slice(0, -2).join(' ');
        }

        if (!text || !start || !end || start > end) {
            return reply(ctx, { ...errorPanel('Datos inválidos', 'Especifica un texto e inicio/fin válidos (inicio ≤ fin).'), ephemeral: true });
        }

        const result = text.slice(start - 1, end);
        return reply(ctx, infoPanel('Subtexto extraído', `\`${result}\``));
    },
};
