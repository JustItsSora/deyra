const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remindin')
        .setDescription('Muestra la fecha y hora exacta dentro de X minutos')
        .addIntegerOption(o => o.setName('minutos').setDescription('Minutos a futuro').setMinValue(1).setRequired(true)),

    name: 'remindin',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const minutes = isSlash(ctx) ? ctx.options.getInteger('minutos') : parseInt(args[0], 10);
        if (!minutes || Number.isNaN(minutes)) {
            return reply(ctx, { ...errorPanel('Valor inválido', 'Especifica una cantidad de minutos válida.'), ephemeral: true });
        }

        const target = Math.floor(Date.now() / 1000) + minutes * 60;
        return reply(ctx, infoPanel('🕐 Cálculo de fecha futura', `En **${minutes} minuto(s)** será: <t:${target}:F> (<t:${target}:R>)`));
    },
};
