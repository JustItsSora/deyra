const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('numberrange')
        .setDescription('Genera una lista de números en un rango dado')
        .addIntegerOption(o => o.setName('inicio').setDescription('Número inicial').setRequired(true))
        .addIntegerOption(o => o.setName('fin').setDescription('Número final').setRequired(true))
        .addIntegerOption(o => o.setName('paso').setDescription('Incremento (default 1)').setMinValue(1).setRequired(false)),

    name: 'numberrange',
    aliases: ['rangonumeros'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        let start, end, step;
        if (isSlash(ctx)) {
            start = ctx.options.getInteger('inicio');
            end = ctx.options.getInteger('fin');
            step = ctx.options.getInteger('paso') || 1;
        } else {
            start = parseInt(args[0], 10);
            end = parseInt(args[1], 10);
            step = parseInt(args[2], 10) || 1;
        }

        if (Number.isNaN(start) || Number.isNaN(end) || start > end) {
            return reply(ctx, { ...errorPanel('Datos inválidos', 'El inicio debe ser menor o igual al fin.'), ephemeral: true });
        }

        const range = [];
        for (let i = start; i <= end && range.length < 200; i += step) range.push(i);

        return reply(ctx, infoPanel('Rango de números', range.join(', ')));
    },
};
