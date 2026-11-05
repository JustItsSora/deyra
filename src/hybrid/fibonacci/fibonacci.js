const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fibonacci')
        .setDescription('Genera los primeros N números de la secuencia de Fibonacci')
        .addIntegerOption(o => o.setName('cantidad').setDescription('Cantidad de números (2-50)').setMinValue(2).setMaxValue(50).setRequired(true)),

    name: 'fibonacci',
    aliases: ['fib'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const n = isSlash(ctx) ? ctx.options.getInteger('cantidad') : parseInt(args[0], 10);
        if (Number.isNaN(n) || n < 2 || n > 50) {
            return reply(ctx, { ...errorPanel('Valor inválido', 'Especifica un número entre 2 y 50.'), ephemeral: true });
        }

        const seq = [0, 1];
        for (let i = 2; i < n; i++) seq.push(seq[i - 1] + seq[i - 2]);

        return reply(ctx, infoPanel('Secuencia de Fibonacci', `\`${seq.join(', ')}\``));
    },
};
