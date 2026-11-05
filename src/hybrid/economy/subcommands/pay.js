const { reply, isSlash, getUserId } = require('../../../lib/reply');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { getBalance, formatAmount } = require('../../../lib/economyUtils');

module.exports = {
    async execute(ctx, args) {
        const senderId = getUserId(ctx);

        let targetId, amount;
        if (isSlash(ctx)) {
            targetId = ctx.options.getUser('usuario')?.id;
            amount = ctx.options.getInteger('cantidad');
        } else {
            targetId = args[0]?.replace(/[<@!>]/g, '');
            amount = parseInt(args[1], 10);
        }

        if (!targetId || !amount || amount <= 0) {
            return reply(ctx, { ...errorPanel('Datos inválidos', 'Especifica un usuario y una cantidad positiva.'), ephemeral: true });
        }
        if (targetId === senderId) {
            return reply(ctx, { ...errorPanel('No puedes hacer eso', 'No puedes transferirte dinero a ti mismo.'), ephemeral: true });
        }

        const sender = await getBalance(ctx.guild.id, senderId);
        if (Number(sender.wallet) < amount) {
            return reply(ctx, { ...errorPanel('Fondos insuficientes', `No tienes esa cantidad en tu billetera (tienes ${formatAmount(sender.wallet)}).`), ephemeral: true });
        }

        const receiver = await getBalance(ctx.guild.id, targetId);

        sender.wallet = Number(sender.wallet) - amount;
        receiver.wallet = Number(receiver.wallet) + amount;
        await Promise.all([sender.save(), receiver.save()]);

        return reply(ctx, successPanel('Transferencia realizada', `Le enviaste ${formatAmount(amount)} a <@${targetId}>.`));
    },
};
