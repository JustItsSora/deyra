const { reply, isSlash, getUserId } = require('../../../lib/reply');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { getBalance, formatAmount } = require('../../../lib/economyUtils');

module.exports = {
    async execute(ctx, args) {
        const userId = getUserId(ctx);
        const record = await getBalance(ctx.guild.id, userId);

        const raw = isSlash(ctx) ? ctx.options.getString('cantidad') : args[0];
        let amount;
        if (raw?.toLowerCase() === 'all') {
            amount = Number(record.bank);
        } else {
            amount = parseInt(raw, 10);
        }

        if (!amount || amount <= 0 || Number.isNaN(amount)) {
            return reply(ctx, { ...errorPanel('Cantidad inválida', 'Especifica un número positivo o "all".'), ephemeral: true });
        }
        if (amount > Number(record.bank)) {
            return reply(ctx, { ...errorPanel('Fondos insuficientes', `No tienes esa cantidad en el banco (tienes ${formatAmount(record.bank)}).`), ephemeral: true });
        }

        record.bank = Number(record.bank) - amount;
        record.wallet = Number(record.wallet) + amount;
        await record.save();

        return reply(ctx, successPanel('Retiro realizado', `Retiraste ${formatAmount(amount)} del banco.`));
    },
};
