const { reply } = require('../../../lib/reply');
const { infoPanel } = require('../../../lib/panel');
const { ShopItem } = require('../../../data/models');
const { formatAmount } = require('../../../lib/economyUtils');

module.exports = {
    async execute(ctx) {
        const items = await ShopItem.findAll({ where: { guildId: ctx.guild.id }, order: [['price', 'ASC']] });

        if (items.length === 0) {
            return reply(ctx, infoPanel('Tienda vacía', 'Este servidor no tiene artículos en la tienda todavía.'));
        }

        const lines = items.map(i =>
            `**${i.name}** — ${formatAmount(i.price)}\n\`${i.itemId}\` · ${i.description || 'Sin descripción'}${i.stock >= 0 ? ` · Stock: ${i.stock}` : ''}`,
        );

        return reply(ctx, infoPanel('Tienda del servidor', 'Usa `/shop buy <id>` para comprar.', { lines }));
    },
};
