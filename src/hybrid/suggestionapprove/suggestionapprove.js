const { SlashCommandBuilder, PermissionFlagsBits, PermissionsBitField } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { hasPermission } = require('../../lib/permissions');
const { successPanel, errorPanel } = require('../../lib/panel');
const { Suggestion } = require('../../data/models');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('suggestionapprove')
        .setDescription('Marca una sugerencia como aprobada')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addStringOption(o => o.setName('message_id').setDescription('ID del mensaje de la sugerencia').setRequired(true)),

    name: 'suggestionapprove',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const executorId = getUserId(ctx);
        const executor = ctx.guild.members.cache.get(executorId) || await ctx.guild.members.fetch(executorId).catch(() => null);
        if (!hasPermission(executor, PermissionsBitField.Flags.ManageGuild)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitas el permiso **Gestionar Servidor**.'), ephemeral: true });
        }

        const messageId = isSlash(ctx) ? ctx.options.getString('message_id') : args[0];
        const suggestion = await Suggestion.findOne({ where: { guildId: ctx.guild.id, messageId } });

        if (!suggestion) {
            return reply(ctx, { ...errorPanel('No encontrada', 'No hay una sugerencia con ese ID de mensaje.'), ephemeral: true });
        }

        suggestion.status = 'approved';
        await suggestion.save();

        return reply(ctx, successPanel('Sugerencia aprobada', 'La sugerencia fue marcada como aprobada.'));
    },
};
