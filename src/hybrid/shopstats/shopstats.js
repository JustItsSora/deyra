const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');
const { ShopItem } = require('../../data/models');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shopstats')
        .setDescription('Muestra estadísticas de la tienda del servidor'),

    name: 'shopstats',
    aliases: [],
    category: 'economía',
    cooldownMs: 3000,

    async execute(ctx) {
        const items = await ShopItem.findAll({ where: { guildId: ctx.guild.id } });

        if (items.length === 0) {
            return reply(ctx, infoPanel('📊 Estadísticas de tienda', 'La tienda de este servidor está vacía.'));
        }

        const avgPrice = items.reduce((sum, i) => sum + i.price, 0) / items.length;
        const mostExpensive = items.reduce((max, i) => (i.price > max.price ? i : max), items[0]);

        return reply(ctx, infoPanel('📊 Estadísticas de tienda', undefined, {
            lines: [
                `**Artículos totales:** ${items.length}`,
                `**Precio promedio:** ${avgPrice.toFixed(0)}`,
                `**Más caro:** ${mostExpensive.name} (${mostExpensive.price})`,
            ],
        }));
    },
};
