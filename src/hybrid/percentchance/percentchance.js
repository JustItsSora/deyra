const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('percentchance')
        .setDescription('Genera un porcentaje de probabilidad aleatorio para algo')
        .addStringOption(o => o.setName('evento').setDescription('El evento a evaluar').setRequired(true)),

    name: 'percentchance',
    aliases: ['probabilidad'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const event = isSlash(ctx) ? ctx.options.getString('evento') : args.join(' ');
        const percent = Math.floor(Math.random() * 101);

        return reply(ctx, infoPanel('🎲 Probabilidad', `**${event || 'Este evento'}**: ${percent}% de probabilidad.`));
    },
};
