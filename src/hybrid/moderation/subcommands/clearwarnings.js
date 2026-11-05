const { PermissionsBitField } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../../lib/reply');
const { hasPermission } = require('../../../lib/permissions');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { Warn } = require('../../../data/models');

module.exports = {
    async execute(ctx, args) {
        const guild = ctx.guild;
        const executorId = getUserId(ctx);
        const executor = guild.members.cache.get(executorId) || await guild.members.fetch(executorId).catch(() => null);

        if (!hasPermission(executor, PermissionsBitField.Flags.ModerateMembers)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitas el permiso **Moderar Miembros**.'), ephemeral: true });
        }

        const userId = isSlash(ctx) ? ctx.options.getUser('usuario')?.id : args[0]?.replace(/[<@!>]/g, '');
        if (!userId) {
            return reply(ctx, { ...errorPanel('Usuario inválido', 'Especifica un usuario.'), ephemeral: true });
        }

        const count = await Warn.destroy({ where: { guildId: guild.id, userId } });
        return reply(ctx, successPanel('Advertencias eliminadas', `Se eliminaron **${count}** advertencia(s) de <@${userId}>.`));
    },
};
