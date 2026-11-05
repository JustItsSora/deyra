const { PermissionsBitField } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../../lib/reply');
const { hasPermission } = require('../../../lib/permissions');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { ShopItem } = require('../../../data/models');

module.exports = {
    async execute(ctx) {
        if (!isSlash(ctx)) return reply(ctx, 'Usa el slash command: `/shop additem`.');

        const executorId = getUserId(ctx);
        const executor = ctx.guild.members.cache.get(executorId) || await ctx.guild.members.fetch(executorId).catch(() => null);
        if (!hasPermission(executor, PermissionsBitField.Flags.ManageGuild)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitas el permiso **Gestionar Servidor**.'), ephemeral: true });
        }

        const itemId = ctx.options.getString('id').toLowerCase().replace(/\s+/g, '-');
        const name = ctx.options.getString('nombre');
        const price = ctx.options.getInteger('precio');
        const description = ctx.options.getString('descripcion');
        const role = ctx.options.getRole('rol');
        const stock = ctx.options.getInteger('stock') ?? -1;

        const existing = await ShopItem.findOne({ where: { guildId: ctx.guild.id, itemId } });
        if (existing) {
            return reply(ctx, { ...errorPanel('Ya existe', 'Ya hay un artículo con ese ID.'), ephemeral: true });
        }

        await ShopItem.create({ guildId: ctx.guild.id, itemId, name, price, description, roleId: role?.id || null, stock });

        return reply(ctx, successPanel('Artículo añadido', `**${name}** (\`${itemId}\`) añadido a la tienda por ${price}.`));
    },
};
