const { PermissionsBitField } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../../lib/reply');
const { hasPermission } = require('../../../lib/permissions');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { Leveling } = require('../../../data/models');

module.exports = {
    async execute(ctx, args) {
        const executorId = getUserId(ctx);
        const executor = ctx.guild.members.cache.get(executorId) || await ctx.guild.members.fetch(executorId).catch(() => null);
        if (!hasPermission(executor, PermissionsBitField.Flags.ManageGuild)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitas el permiso **Gestionar Servidor**.'), ephemeral: true });
        }

        const userId = isSlash(ctx) ? ctx.options.getUser('usuario')?.id : args[0]?.replace(/[<@!>]/g, '');
        if (!userId) {
            return reply(ctx, { ...errorPanel('Usuario inválido', 'Especifica un usuario.'), ephemeral: true });
        }

        const record = await Leveling.findOne({ where: { guildId: ctx.guild.id, userId } });
        if (!record) {
            return reply(ctx, { ...errorPanel('Sin datos', 'Ese usuario no tiene XP registrado.'), ephemeral: true });
        }

        record.xp = 0;
        record.level = 0;
        record.totalMessages = 0;
        await record.save();

        return reply(ctx, successPanel('XP reiniciado', `Se reinició el XP de <@${userId}>.`));
    },
};
