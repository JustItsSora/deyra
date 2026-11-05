const { PermissionsBitField } = require('discord.js');
const { reply, getUserId } = require('../../../lib/reply');
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
        if (!user || !member) {
            return reply(ctx, { ...errorPanel('Usuario inválido', 'No pude encontrar a ese usuario en el servidor.'), ephemeral: true });
        }

        if (!botCanModerate(guild, member)) {
            return reply(ctx, { ...errorPanel('No puedo hacer eso', 'Mi rol no está por encima del de ese usuario.'), ephemeral: true });
        }
        if (!executorOutranks(executor, member)) {
            return reply(ctx, { ...errorPanel('No puedes hacer eso', 'Ese usuario tiene un rol igual o superior al tuyo.'), ephemeral: true });
        }

        try {
            await guild.members.ban(user.id, { deleteMessageSeconds: 86400, reason: `Softban: ${reason} | Moderador: ${executor.user.tag}` });
            await guild.members.unban(user.id, 'Softban: desbaneo automático');

            await logModAction(guild, {
                title: `${emoji('DENY')} Softban aplicado`,
                description: `**Usuario:** ${user.tag} (${user.id})\n**Moderador:** ${executor.user.tag}\n**Razón:** ${reason}\n\nSe borraron sus mensajes del último día. El usuario puede volver a entrar.`,
                tone: 'warning',
            });

            return reply(ctx, successPanel('Softban aplicado', `Se limpiaron los mensajes recientes de ${user.tag} y puede volver a unirse.`));
        } catch (err) {
            console.error('[mod softban] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude aplicar el softban.'), ephemeral: true });
        }
    },
};
