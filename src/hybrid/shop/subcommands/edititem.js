const { PermissionsBitField } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../../lib/reply');
const { hasPermission } = require('../../../lib/permissions');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { ShopItem } = require('../../../data/models');

module.exports = {
    async execute(ctx) {
        if (!isSlash(ctx)) return reply(ctx, 'Usa el slash command: `/shop edititem`.');

        const executorId = getUserId(ctx);
        const executor = ctx.guild.members.cache.get(executorId) || await ctx.guild.members.fetch(executorId).catch(() => null);
        if (!hasPermission(executor, PermissionsBitField.Flags.ManageGuild)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitas el permiso **Gestionar Servidor**.'), ephemeral: true });
        }

        const itemId = ctx.options.getString('id');
        const price = ctx.options.getInteger('precio');

        const item = await ShopItem.findOne({ where: { guildId: ctx.guild.id, itemId } });
        if (!item) {
            return reply(ctx, { ...errorPanel('No encontrado', 'No existe un artículo con ese ID.'), ephemeral: true });
        }

        item.price = price;
        await item.save();

        return reply(ctx, successPanel('Artículo actualizado', `**${item.name}** ahora cuesta ${price}.`));
    },
};
