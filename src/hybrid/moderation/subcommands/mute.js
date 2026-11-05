const { PermissionsBitField } = require('discord.js');
const { reply, getUserId } = require('../../../lib/reply');
const { hasPermission, botCanModerate, executorOutranks } = require('../../../lib/permissions');
const { getTargetAndReason, getDurationArg, getReasonAfterDuration } = require('../../../lib/modArgs');
const { parseDuration, formatDuration } = require('../../../lib/duration');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { logModAction } = require('../../../lib/modLog');
const { emoji } = require('../../../lib/emojis');

const MAX_TIMEOUT_MS = 28 * 24 * 60 * 60 * 1000; // límite de Discord: 28 días

module.exports = {
    async execute(ctx, args) {
        const guild = ctx.guild;
        const executorId = getUserId(ctx);
        const executor = guild.members.cache.get(executorId) || await guild.members.fetch(executorId).catch(() => null);

        if (!hasPermission(executor, PermissionsBitField.Flags.ModerateMembers)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitas el permiso **Moderar Miembros**.'), ephemeral: true });
        }

        const { user, member } = await getTargetAndReason(ctx, args);
        if (!user || !member) {
            return reply(ctx, { ...errorPanel('Usuario inválido', 'No pude encontrar a ese usuario en el servidor.'), ephemeral: true });
        }

        const durationRaw = getDurationArg(ctx, args);
        const durationMs = parseDuration(durationRaw);
        if (!durationMs) {
            return reply(ctx, { ...errorPanel('Duración inválida', 'Usa un formato como `10m`, `1h`, `2d` (máximo 28 días).'), ephemeral: true });
        }
        if (durationMs > MAX_TIMEOUT_MS) {
            return reply(ctx, { ...errorPanel('Duración muy larga', 'El máximo permitido por Discord es 28 días.'), ephemeral: true });
        }

        const reason = getReasonAfterDuration(ctx, args);

        if (!botCanModerate(guild, member)) {
            return reply(ctx, { ...errorPanel('No puedo hacer eso', 'Mi rol no está por encima del de ese usuario.'), ephemeral: true });
        }
        if (!executorOutranks(executor, member)) {
            return reply(ctx, { ...errorPanel('No puedes hacer eso', 'Ese usuario tiene un rol igual o superior al tuyo.'), ephemeral: true });
        }

        try {
            await member.timeout(durationMs, `${reason} | Moderador: ${executor.user.tag}`);

            await logModAction(guild, {
                title: `${emoji('CLOCK')} Usuario silenciado`,
                description: `**Usuario:** ${user.tag} (${user.id})\n**Duración:** ${formatDuration(durationMs)}\n**Moderador:** ${executor.user.tag}\n**Razón:** ${reason}`,
                tone: 'warning',
            });

            return reply(ctx, successPanel('Usuario silenciado', `${user.tag} ha sido silenciado por **${formatDuration(durationMs)}**.\n**Razón:** ${reason}`));
        } catch (err) {
            console.error('[mod mute] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude silenciar a ese usuario.'), ephemeral: true });
        }
    },
};
