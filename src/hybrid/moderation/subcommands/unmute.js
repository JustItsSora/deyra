const { PermissionsBitField } = require('discord.js');
const { reply, getUserId } = require('../../../lib/reply');
const { hasPermission } = require('../../../lib/permissions');
const { getTargetAndReason } = require('../../../lib/modArgs');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { logModAction } = require('../../../lib/modLog');
const { emoji } = require('../../../lib/emojis');

module.exports = {
    async execute(ctx, args) {
        const guild = ctx.guild;
        const executorId = getUserId(ctx);
        const executor = guild.members.cache.get(executorId) || await guild.members.fetch(executorId).catch(() => null);

        if (!hasPermission(executor, PermissionsBitField.Flags.ModerateMembers)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitas el permiso **Moderar Miembros**.'), ephemeral: true });
        }

        const { user, member, reason } = await getTargetAndReason(ctx, args);
        if (!user || !member) {
            return reply(ctx, { ...errorPanel('Usuario inválido', 'No pude encontrar a ese usuario en el servidor.'), ephemeral: true });
        }

        if (!member.isCommunicationDisabled?.()) {
            return reply(ctx, { ...errorPanel('No está silenciado', 'Ese usuario no tiene un timeout activo.'), ephemeral: true });
        }

        try {
            await member.timeout(null, `${reason} | Moderador: ${executor.user.tag}`);

            await logModAction(guild, {
                title: `${emoji('YES')} Silencio removido`,
                description: `**Usuario:** ${user.tag} (${user.id})\n**Moderador:** ${executor.user.tag}\n**Razón:** ${reason}`,
                tone: 'success',
            });

            return reply(ctx, successPanel('Silencio removido', `Se le quitó el silencio a ${user.tag}.`));
        } catch (err) {
            console.error('[mod unmute] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude quitar el silencio a ese usuario.'), ephemeral: true });
        }
    },
};
