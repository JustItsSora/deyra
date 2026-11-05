const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');
const { Warn } = require('../../data/models');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warnreason')
        .setDescription('Muestra los detalles de una advertencia por su ID')
        .addIntegerOption(o => o.setName('id').setDescription('ID de la advertencia').setRequired(true)),

    name: 'warnreason',
    aliases: [],
    category: 'moderación',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const id = isSlash(ctx) ? ctx.options.getInteger('id') : parseInt(args[0], 10);
        const warn = await Warn.findOne({ where: { id, guildId: ctx.guild.id } });

        if (!warn) {
            return reply(ctx, { ...errorPanel('No encontrada', 'No hay ninguna advertencia con ese ID.'), ephemeral: true });
        }

        return reply(ctx, infoPanel(`Advertencia #${warn.id}`, undefined, {
            lines: [
                `**Usuario:** <@${warn.userId}>`,
                `**Moderador:** <@${warn.moderatorId}>`,
                `**Razón:** ${warn.reason}`,
                `**Fecha:** <t:${Math.floor(warn.createdAt.getTime() / 1000)}:F>`,
            ],
        }));
    },
};
