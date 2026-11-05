const { reply, isSlash, getUserId } = require('../../../lib/reply');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { getBalance } = require('../../../lib/economyUtils');
const { ShopItem } = require('../../../data/models');

module.exports = {
    async execute(ctx, args) {
        const senderId = getUserId(ctx);
        let targetId, itemId;
        if (isSlash(ctx)) {
            targetId = ctx.options.getUser('usuario')?.id;
            itemId = ctx.options.getString('item_id');
        } else {
            targetId = args[0]?.replace(/[<@!>]/g, '');
            itemId = args[1];
        }

        if (!targetId || !itemId) {
            return reply(ctx, { ...errorPanel('Datos inválidos', 'Especifica un usuario y el ID del ítem.'), ephemeral: true });
        }
        if (targetId === senderId) {
            return reply(ctx, { ...errorPanel('No puedes hacer eso', 'No puedes regalarte algo a ti mismo.'), ephemeral: true });
        }

        const sender = await getBalance(ctx.guild.id, senderId);
        const senderInventory = JSON.parse(sender.inventory || '[]');
        const idx = senderInventory.indexOf(itemId);

        if (idx === -1) {
            return reply(ctx, { ...errorPanel('No lo tienes', 'No tienes ese ítem en tu inventario.'), ephemeral: true });
        }

        senderInventory.splice(idx, 1);
        sender.inventory = JSON.stringify(senderInventory);
        await sender.save();

        const receiver = await getBalance(ctx.guild.id, targetId);
        const receiverInventory = JSON.parse(receiver.inventory || '[]');
        receiverInventory.push(itemId);
        receiver.inventory = JSON.stringify(receiverInventory);
        await receiver.save();

        const item = await ShopItem.findOne({ where: { guildId: ctx.guild.id, itemId } });
        return reply(ctx, successPanel('Regalo enviado', `Le regalaste **${item?.name || itemId}** a <@${targetId}>.`));
    },
};
