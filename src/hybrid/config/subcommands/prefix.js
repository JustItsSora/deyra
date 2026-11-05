const { PermissionsBitField } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../../lib/reply');
const { hasPermission } = require('../../../lib/permissions');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { GuildConfig } = require('../../../data/models');

module.exports = {
    async execute(ctx, args) {
        const executorId = getUserId(ctx);
        const executor = ctx.guild.members.cache.get(executorId) || await ctx.guild.members.fetch(executorId).catch(() => null);
        if (!hasPermission(executor, PermissionsBitField.Flags.ManageGuild)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitas el permiso **Gestionar Servidor**.'), ephemeral: true });
        }

        const newPrefix = isSlash(ctx) ? ctx.options.getString('nuevo_prefijo') : args[0];
        if (!newPrefix || newPrefix.length > 5) {
            return reply(ctx, { ...errorPanel('Prefijo inválido', 'El prefijo debe tener máximo 5 caracteres.'), ephemeral: true });
        }

        const [config] = await GuildConfig.findOrCreate({ where: { guildId: ctx.guild.id }, defaults: { guildId: ctx.guild.id } });
        config.prefix = newPrefix;
        await config.save();

        return reply(ctx, successPanel('Prefijo actualizado', `El nuevo prefijo es: \`${newPrefix}\``));
    },
};
