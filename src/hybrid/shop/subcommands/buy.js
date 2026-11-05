const { reply, isSlash, getUserId } = require('../../../lib/reply');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { ShopItem } = require('../../../data/models');
const { getBalance, formatAmount } = require('../../../lib/economyUtils');

module.exports = {
    async execute(ctx, args) {
        const itemId = isSlash(ctx) ? ctx.options.getString('id') : args[0];
        if (!itemId) {
            return reply(ctx, { ...errorPanel('Falta el ID', 'Especifica el ID del artículo (usa `/shop list` para verlos).'), ephemeral: true });
        }

        const item = await ShopItem.findOne({ where: { guildId: ctx.guild.id, itemId } });
        if (!item) {
            return reply(ctx, { ...errorPanel('No encontrado', 'No existe un artículo con ese ID.'), ephemeral: true });
        }
        if (item.stock === 0) {
            return reply(ctx, { ...errorPanel('Sin stock', 'Este artículo está agotado.'), ephemeral: true });
        }

        const userId = getUserId(ctx);
        const record = await getBalance(ctx.guild.id, userId);

        if (Number(record.wallet) < item.price) {
            return reply(ctx, { ...errorPanel('Fondos insuficientes', `Necesitas ${formatAmount(item.price)} y tienes ${formatAmount(record.wallet)}.`), ephemeral: true });
        }

        record.wallet = Number(record.wallet) - item.price;
        const inventory = JSON.parse(record.inventory || '[]');
        inventory.push(item.itemId);
        record.inventory = JSON.stringify(inventory);
        await record.save();

        if (item.stock > 0) {
            item.stock -= 1;
            await item.save();
        }

        if (item.roleId) {
            const member = await ctx.guild.members.fetch(userId).catch(() => null);
            if (member) await member.roles.add(item.roleId).catch(() => {});
        }

        return reply(ctx, successPanel('Compra realizada', `Compraste **${item.name}** por ${formatAmount(item.price)}.`));
    },
};
