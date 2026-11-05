const { PermissionsBitField } = require('discord.js');
const { reply, getUserId } = require('../../../lib/reply');
const { hasPermission } = require('../../../lib/permissions');
const { getTargetAndReason } = require('../../../lib/modArgs');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { logModAction } = require('../../../lib/modLog');
const { Warn } = require('../../../data/models');
const { emoji } = require('../../../lib/emojis');

module.exports = {
    async execute(ctx, args) {
        const guild = ctx.guild;
        const executorId = getUserId(ctx);
        const executor = guild.members.cache.get(executorId) || await guild.members.fetch(executorId).catch(() => null);

        if (!hasPermission(executor, PermissionsBitField.Flags.ModerateMembers)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitas el permiso **Moderar Miembros**.'), ephemeral: true });
        }

        const { user, reason } = await getTargetAndReason(ctx, args);
        if (!user) {
            return reply(ctx, { ...errorPanel('Usuario inválido', 'No pude encontrar a ese usuario.'), ephemeral: true });
        }
        if (reason === 'Sin razón especificada') {
            return reply(ctx, { ...errorPanel('Falta la razón', 'Debes especificar una razón para la advertencia.'), ephemeral: true });
        }

        try {
            const warn = await Warn.create({ guildId: guild.id, userId: user.id, moderatorId: executor.id, reason });
            const totalWarns = await Warn.count({ where: { guildId: guild.id, userId: user.id } });

            await user.send({ ...errorPanel(`Recibiste una advertencia en ${guild.name}`, `**Razón:** ${reason}`) }).catch(() => {});

            await logModAction(guild, {
                title: `${emoji('WARNING')} Advertencia añadida`,
                description: `**Usuario:** ${user.tag} (${user.id})\n**Moderador:** ${executor.user.tag}\n**Razón:** ${reason}\n**ID advertencia:** ${warn.id} · Total: ${totalWarns}`,
                tone: 'warning',
            });

            return reply(ctx, successPanel('Advertencia registrada', `${user.tag} ahora tiene **${totalWarns}** advertencia(s).\n**Razón:** ${reason}`));
        } catch (err) {
            console.error('[mod warn] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude registrar la advertencia.'), ephemeral: true });
        }
    },
};
