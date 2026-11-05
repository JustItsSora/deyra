const { PermissionsBitField } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../../lib/reply');
const { hasPermission } = require('../../../lib/permissions');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { ShopItem } = require('../../../data/models');

module.exports = {
    async execute(ctx, args) {
        const executorId = getUserId(ctx);
        const executor = ctx.guild.members.cache.get(executorId) || await ctx.guild.members.fetch(executorId).catch(() => null);
        if (!hasPermission(executor, PermissionsBitField.Flags.ManageGuild)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitas el permiso **Gestionar Servidor**.'), ephemeral: true });
        }

        const itemId = isSlash(ctx) ? ctx.options.getString('id') : args[0];
        const deleted = await ShopItem.destroy({ where: { guildId: ctx.guild.id, itemId } });

        if (!deleted) {
            return reply(ctx, { ...errorPanel('No encontrado', 'No existe un artículo con ese ID.'), ephemeral: true });
        }

        return reply(ctx, successPanel('Artículo eliminado', `Se eliminó el artículo \`${itemId}\` de la tienda.`));
    },
};
