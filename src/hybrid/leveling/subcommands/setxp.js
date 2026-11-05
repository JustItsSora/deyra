const { PermissionsBitField } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../../lib/reply');
const { hasPermission } = require('../../../lib/permissions');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { LevelConfig } = require('../../../data/models');

module.exports = {
    async execute(ctx) {
        if (!isSlash(ctx)) return reply(ctx, 'Usa el slash command: `/level setxp`.');

        const executorId = getUserId(ctx);
        const executor = ctx.guild.members.cache.get(executorId) || await ctx.guild.members.fetch(executorId).catch(() => null);
        if (!hasPermission(executor, PermissionsBitField.Flags.ManageGuild)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitas el permiso **Gestionar Servidor**.'), ephemeral: true });
        }

        const min = ctx.options.getInteger('min');
        const max = ctx.options.getInteger('max');
        if (min > max) {
            return reply(ctx, { ...errorPanel('Rango inválido', 'El mínimo no puede ser mayor que el máximo.'), ephemeral: true });
        }

        const [config] = await LevelConfig.findOrCreate({ where: { guildId: ctx.guild.id }, defaults: { guildId: ctx.guild.id } });
        config.xpPerMessageMin = min;
        config.xpPerMessageMax = max;
        await config.save();

        return reply(ctx, successPanel('XP actualizado', `Ahora cada mensaje otorga entre **${min}** y **${max}** XP.`));
    },
};
