const { SlashCommandBuilder, PermissionFlagsBits, PermissionsBitField } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { hasPermission } = require('../../lib/permissions');
const { successPanel, errorPanel } = require('../../lib/panel');
const { Warn } = require('../../data/models');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warnedit')
        .setDescription('Edita la razón de una advertencia existente')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addIntegerOption(o => o.setName('id').setDescription('ID de la advertencia').setRequired(true))
        .addStringOption(o => o.setName('nueva_razon').setDescription('Nueva razón').setRequired(true)),

    name: 'warnedit',
    aliases: [],
    category: 'moderación',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const executorId = getUserId(ctx);
        const executor = ctx.guild.members.cache.get(executorId) || await ctx.guild.members.fetch(executorId).catch(() => null);
        if (!hasPermission(executor, PermissionsBitField.Flags.ModerateMembers)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitas el permiso **Moderar Miembros**.'), ephemeral: true });
        }

        let id, reason;
        if (isSlash(ctx)) {
            id = ctx.options.getInteger('id');
            reason = ctx.options.getString('nueva_razon');
        } else {
            id = parseInt(args[0], 10);
            reason = args.slice(1).join(' ');
        }

        const warn = await Warn.findOne({ where: { id, guildId: ctx.guild.id } });
        if (!warn) {
            return reply(ctx, { ...errorPanel('No encontrada', 'No hay ninguna advertencia con ese ID.'), ephemeral: true });
        }

        warn.reason = reason;
        await warn.save();

        return reply(ctx, successPanel('Advertencia editada', `Se actualizó la razón de la advertencia #${id}.`));
    },
};
