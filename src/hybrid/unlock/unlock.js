const { SlashCommandBuilder, PermissionFlagsBits, PermissionsBitField } = require('discord.js');
const { reply, getUserId } = require('../../lib/reply');
const { hasPermission } = require('../../lib/permissions');
const { successPanel, errorPanel } = require('../../lib/panel');
const { logModAction } = require('../../lib/modLog');
const { emoji } = require('../../lib/emojis');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unlock')
        .setDescription('Desbloquea este canal para que @everyone pueda volver a escribir')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    name: 'unlock',
    aliases: [],
    category: 'moderación',
    cooldownMs: 3000,

    async execute(ctx) {
        const executorId = getUserId(ctx);
        const executor = ctx.guild.members.cache.get(executorId) || await ctx.guild.members.fetch(executorId).catch(() => null);
        if (!hasPermission(executor, PermissionsBitField.Flags.ManageChannels)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitas el permiso **Gestionar Canales**.'), ephemeral: true });
        }

        try {
            await ctx.channel.permissionOverwrites.edit(ctx.guild.roles.everyone, { SendMessages: null });
            await logModAction(ctx.guild, {
                title: `${emoji('YES')} Canal desbloqueado`,
                description: `**Canal:** ${ctx.channel}\n**Moderador:** ${executor.user.tag}`,
                tone: 'success',
            });
            return reply(ctx, successPanel('Canal desbloqueado', 'Este canal ha sido desbloqueado.'));
        } catch (err) {
            console.error('[unlock] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude desbloquear este canal.'), ephemeral: true });
        }
    },
};
