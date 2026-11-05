const { SlashCommandBuilder, PermissionFlagsBits, PermissionsBitField } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { hasPermission } = require('../../lib/permissions');
const { successPanel, errorPanel } = require('../../lib/panel');
const { logModAction } = require('../../lib/modLog');
const { emoji } = require('../../lib/emojis');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lockdown')
        .setDescription('Bloquea este canal para que @everyone no pueda escribir')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addStringOption(o => o.setName('razon').setDescription('Razón del bloqueo').setRequired(false)),

    name: 'lockdown',
    aliases: ['lock'],
    category: 'moderación',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        const executorId = getUserId(ctx);
        const executor = ctx.guild.members.cache.get(executorId) || await ctx.guild.members.fetch(executorId).catch(() => null);
        if (!hasPermission(executor, PermissionsBitField.Flags.ManageChannels)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitas el permiso **Gestionar Canales**.'), ephemeral: true });
        }

        const reason = isSlash(ctx) ? (ctx.options.getString('razon') || 'Sin razón especificada') : (args.join(' ') || 'Sin razón especificada');

        try {
            await ctx.channel.permissionOverwrites.edit(ctx.guild.roles.everyone, { SendMessages: false });
            await logModAction(ctx.guild, {
                title: `${emoji('LOCK')} Canal bloqueado`,
                description: `**Canal:** ${ctx.channel}\n**Moderador:** ${executor.user.tag}\n**Razón:** ${reason}`,
                tone: 'warning',
            });
            return reply(ctx, successPanel('Canal bloqueado', `Este canal ha sido bloqueado.\n**Razón:** ${reason}`));
        } catch (err) {
            console.error('[lockdown] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude bloquear este canal.'), ephemeral: true });
        }
    },
};
