const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('factorial')
        .setDescription('Calcula el factorial de un número')
        .addIntegerOption(o => o.setName('numero').setDescription('Número (0-170)').setMinValue(0).setMaxValue(170).setRequired(true)),

    name: 'factorial',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const n = isSlash(ctx) ? ctx.options.getInteger('numero') : parseInt(args[0], 10);
        if (Number.isNaN(n) || n < 0 || n > 170) {
            return reply(ctx, { ...errorPanel('Valor inválido', 'Especifica un número entre 0 y 170 (más allá excede el límite de precisión).'), ephemeral: true });
        }

        let result = 1;
        for (let i = 2; i <= n; i++) result *= i;

        return reply(ctx, infoPanel('Factorial', `**${n}!** = ${result.toLocaleString('es-ES')}`));
    },
};
