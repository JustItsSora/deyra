const { PermissionsBitField } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../../lib/reply');
const { hasPermission } = require('../../../lib/permissions');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { LevelConfig } = require('../../../data/models');

module.exports = {
    async execute(ctx) {
        if (!isSlash(ctx)) return reply(ctx, 'Usa el slash command: `/level addrolereward`.');

        const executorId = getUserId(ctx);
        const executor = ctx.guild.members.cache.get(executorId) || await ctx.guild.members.fetch(executorId).catch(() => null);
        if (!hasPermission(executor, PermissionsBitField.Flags.ManageGuild)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitas el permiso **Gestionar Servidor**.'), ephemeral: true });
        }

        const level = ctx.options.getInteger('nivel');
        const role = ctx.options.getRole('rol');

        const [config] = await LevelConfig.findOrCreate({ where: { guildId: ctx.guild.id }, defaults: { guildId: ctx.guild.id } });
        const rewards = JSON.parse(config.roleRewards || '{}');
        rewards[String(level)] = role.id;
        config.roleRewards = JSON.stringify(rewards);
        await config.save();

        return reply(ctx, successPanel('Recompensa añadida', `Al llegar a nivel **${level}**, los usuarios recibirán el rol ${role}.`));
    },
};
