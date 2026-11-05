const { PermissionsBitField } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../../lib/reply');
const { hasPermission, botCanModerate, executorOutranks } = require('../../../lib/permissions');
const { getTargetAndReason } = require('../../../lib/modArgs');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { logModAction } = require('../../../lib/modLog');
const { emoji } = require('../../../lib/emojis');

module.exports = {
    async execute(ctx, args) {
        const guild = ctx.guild;
        const executorId = getUserId(ctx);
        const executor = guild.members.cache.get(executorId) || await guild.members.fetch(executorId).catch(() => null);

        if (!hasPermission(executor, PermissionsBitField.Flags.BanMembers)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitas el permiso **Banear Miembros**.'), ephemeral: true });
        }

        const { user, member, reason } = await getTargetAndReason(ctx, args);
        if (!user) {
            return reply(ctx, { ...errorPanel('Usuario inválido', 'No pude encontrar a ese usuario.'), ephemeral: true });
        }

        if (member) {
            if (!botCanModerate(guild, member)) {
                return reply(ctx, { ...errorPanel('No puedo hacer eso', 'Mi rol no está por encima del de ese usuario, o es el dueño del servidor.'), ephemeral: true });
            }
            if (!executorOutranks(executor, member)) {
                return reply(ctx, { ...errorPanel('No puedes hacer eso', 'Ese usuario tiene un rol igual o superior al tuyo.'), ephemeral: true });
            }
        }

        const deleteDays = isSlash(ctx) ? (ctx.options.getInteger('dias_borrado') ?? 0) : 0;

        try {
            await user.send({ ...errorPanel(`Fuiste baneado de ${guild.name}`, `**Razón:** ${reason}`) }).catch(() => {});
            await guild.members.ban(user.id, { deleteMessageSeconds: deleteDays * 86400, reason: `${reason} | Moderador: ${executor.user.tag}` });

            await logModAction(guild, {
                title: `${emoji('BAN')} Usuario baneado`,
                description: `**Usuario:** ${user.tag} (${user.id})\n**Moderador:** ${executor.user.tag}\n**Razón:** ${reason}`,
                tone: 'error',
            });

            return reply(ctx, successPanel('Usuario baneado', `${user.tag} ha sido baneado.\n**Razón:** ${reason}`));
        } catch (err) {
            console.error('[mod ban] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude banear a ese usuario. Revisa mis permisos y jerarquía de roles.'), ephemeral: true });
        }
    },
};
