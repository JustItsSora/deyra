const { reply, isSlash, getUserId } = require('../../../lib/reply');
const { infoPanel } = require('../../../lib/panel');
const { ShopItem } = require('../../../data/models');
const { getBalance } = require('../../../lib/economyUtils');

module.exports = {
    async execute(ctx, args) {
        const userId = isSlash(ctx) ? (ctx.options.getUser('usuario')?.id || getUserId(ctx)) : (args[0]?.replace(/[<@!>]/g, '') || getUserId(ctx));
        const user = await ctx.client.users.fetch(userId).catch(() => null);
        if (!user) return reply(ctx, { content: 'No pude encontrar a ese usuario.', ephemeral: true });

        const record = await getBalance(ctx.guild.id, userId);
        const inventory = JSON.parse(record.inventory || '[]');

        if (inventory.length === 0) {
            return reply(ctx, infoPanel(`Inventario de ${user.username}`, 'No tiene artículos.'));
        }

        const counts = inventory.reduce((acc, id) => { acc[id] = (acc[id] || 0) + 1; return acc; }, {});
        const items = await ShopItem.findAll({ where: { guildId: ctx.guild.id, itemId: Object.keys(counts) } });
        const nameMap = Object.fromEntries(items.map(i => [i.itemId, i.name]));

        const lines = Object.entries(counts).map(([id, count]) => `**${nameMap[id] || id}** x${count}`);

        return reply(ctx, infoPanel(`Inventario de ${user.username}`, undefined, { lines }));
    },
};
