const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dectobin')
        .setDescription('Convierte un número decimal a binario')
        .addIntegerOption(o => o.setName('numero').setDescription('Número decimal').setMinValue(0).setRequired(true)),

    name: 'dectobin',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const n = isSlash(ctx) ? ctx.options.getInteger('numero') : parseInt(args[0], 10);
        if (Number.isNaN(n) || n < 0) {
            return reply(ctx, { ...errorPanel('Valor inválido', 'Especifica un número entero positivo.'), ephemeral: true });
        }

        return reply(ctx, infoPanel('Decimal a Binario', `**${n}** = **${n.toString(2)}**`));
    },
};
