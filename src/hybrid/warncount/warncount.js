const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');
const { Warn } = require('../../data/models');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warncount')
        .setDescription('Muestra el total de advertencias registradas en el servidor'),

    name: 'warncount',
    aliases: [],
    category: 'moderación',
    cooldownMs: 3000,

    async execute(ctx) {
        const total = await Warn.count({ where: { guildId: ctx.guild.id } });
        return reply(ctx, infoPanel('Total de advertencias', `Este servidor tiene **${total}** advertencia(s) registrada(s) en total.`));
    },
};
