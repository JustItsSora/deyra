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

        if (!hasPermission(executor, PermissionsBitField.Flags.KickMembers)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitas el permiso **Expulsar Miembros**.'), ephemeral: true });
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
            await user.send({ ...errorPanel(`Fuiste expulsado de ${guild.name}`, `**Razón:** ${reason}`) }).catch(() => {});
            await member.kick(`${reason} | Moderador: ${executor.user.tag}`);

            await logModAction(guild, {
                title: `${emoji('WARNING')} Usuario expulsado`,
                description: `**Usuario:** ${user.tag} (${user.id})\n**Moderador:** ${executor.user.tag}\n**Razón:** ${reason}`,
                tone: 'warning',
            });

            return reply(ctx, successPanel('Usuario expulsado', `${user.tag} ha sido expulsado.\n**Razón:** ${reason}`));
        } catch (err) {
            console.error('[mod kick] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude expulsar a ese usuario.'), ephemeral: true });
        }
    },
};
