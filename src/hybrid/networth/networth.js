const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');
const { Economy, ShopItem } = require('../../data/models');
const { formatAmount } = require('../../lib/economyUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('networth')
        .setDescription('Muestra tu patrimonio total (dinero + valor del inventario)')
        .addUserOption(o => o.setName('usuario').setDescription('Usuario a consultar').setRequired(false)),

    name: 'networth',
    aliases: ['patrimonio'],
    category: 'economía',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const userId = isSlash(ctx) ? (ctx.options.getUser('usuario')?.id || getUserId(ctx)) : (args[0]?.replace(/[<@!>]/g, '') || getUserId(ctx));
        const user = await ctx.client.users.fetch(userId).catch(() => null);
        if (!user) return reply(ctx, { ...errorPanel('Usuario inválido', 'No pude encontrar a ese usuario.'), ephemeral: true });

        const record = await Economy.findOne({ where: { guildId: ctx.guild.id, userId } });
        if (!record) {
            return reply(ctx, infoPanel(`Patrimonio de ${user.username}`, `${formatAmount(0)} — sin actividad económica registrada.`));
        }

        const inventory = JSON.parse(record.inventory || '[]');
        let inventoryValue = 0;
        if (inventory.length > 0) {
            const counts = inventory.reduce((acc, id) => { acc[id] = (acc[id] || 0) + 1; return acc; }, {});
            const items = await ShopItem.findAll({ where: { guildId: ctx.guild.id, itemId: Object.keys(counts) } });
            for (const item of items) {
                inventoryValue += item.price * counts[item.itemId];
            }
        }

        const cash = Number(record.wallet) + Number(record.bank);
        const total = cash + inventoryValue;

        return reply(ctx, infoPanel(`Patrimonio de ${user.username}`, undefined, {
            lines: [
                `**Efectivo (billetera + banco):** ${formatAmount(cash)}`,
                `**Valor de inventario:** ${formatAmount(inventoryValue)}`,
                `**Patrimonio total:** ${formatAmount(total)}`,
            ],
        }));
    },
};
