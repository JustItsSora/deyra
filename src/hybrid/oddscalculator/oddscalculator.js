const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('oddscalculator')
        .setDescription('Calcula las probabilidades de ganar algo con N intentos y una probabilidad por intento')
        .addNumberOption(o => o.setName('probabilidad').setDescription('Probabilidad por intento (0-100)').setMinValue(0).setMaxValue(100).setRequired(true))
        .addIntegerOption(o => o.setName('intentos').setDescription('Número de intentos').setMinValue(1).setMaxValue(1000).setRequired(true)),

    name: 'oddscalculator',
    aliases: ['calculadoraprobabilidad'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        let probability, attempts;
        if (isSlash(ctx)) {
            probability = ctx.options.getNumber('probabilidad');
            attempts = ctx.options.getInteger('intentos');
        } else {
            probability = parseFloat(args[0]);
            attempts = parseInt(args[1], 10);
        }

        if (Number.isNaN(probability) || Number.isNaN(attempts)) {
            return reply(ctx, { ...errorPanel('Datos inválidos', 'Especifica una probabilidad (0-100) y número de intentos.'), ephemeral: true });
        }

        const p = probability / 100;
        const chanceOfAtLeastOne = (1 - Math.pow(1 - p, attempts)) * 100;

        return reply(ctx, infoPanel('🎲 Cálculo de probabilidades', `Con ${probability}% de probabilidad por intento y **${attempts}** intentos:\n\nProbabilidad de éxito al menos una vez: **${chanceOfAtLeastOne.toFixed(2)}%**`));
    },
};
