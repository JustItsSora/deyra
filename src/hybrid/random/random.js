const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('random')
        .setDescription('Genera un número aleatorio entre dos valores')
        .addIntegerOption(o => o.setName('min').setDescription('Valor mínimo').setRequired(true))
        .addIntegerOption(o => o.setName('max').setDescription('Valor máximo').setRequired(true)),

    name: 'random',
    aliases: ['aleatorio'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        let min, max;
        if (isSlash(ctx)) {
            min = ctx.options.getInteger('min');
            max = ctx.options.getInteger('max');
        } else {
            min = parseInt(args[0], 10);
            max = parseInt(args[1], 10);
        }

        if (Number.isNaN(min) || Number.isNaN(max) || min > max) {
            return reply(ctx, { ...errorPanel('Valores inválidos', 'El mínimo debe ser menor o igual al máximo.'), ephemeral: true });
        }

        const result = Math.floor(Math.random() * (max - min + 1)) + min;
        return reply(ctx, infoPanel('🎲 Número aleatorio', `**${result}**`));
    },
};
