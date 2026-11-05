const { reply, isSlash, getUserId } = require('../../../lib/reply');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { getBalance, formatAmount } = require('../../../lib/economyUtils');

module.exports = {
    async execute(ctx, args) {
        const userId = getUserId(ctx);
        const record = await getBalance(ctx.guild.id, userId);

        const raw = isSlash(ctx) ? ctx.options.getString('cantidad') : args[0];
        const spaceLeft = Number(record.bankCapacity) - Number(record.bank);

        let amount;
        if (raw?.toLowerCase() === 'all') {
            amount = Math.min(Number(record.wallet), spaceLeft);
        } else {
            amount = parseInt(raw, 10);
        }

        if (!amount || amount <= 0 || Number.isNaN(amount)) {
            return reply(ctx, { ...errorPanel('Cantidad inválida', 'Especifica un número positivo o "all".'), ephemeral: true });
        }
        if (amount > Number(record.wallet)) {
            return reply(ctx, { ...errorPanel('Fondos insuficientes', `No tienes esa cantidad en tu billetera (tienes ${formatAmount(record.wallet)}).`), ephemeral: true });
        }
        if (amount > spaceLeft) {
            return reply(ctx, { ...errorPanel('Capacidad del banco excedida', `Tu banco solo tiene espacio para ${formatAmount(spaceLeft)} más.`), ephemeral: true });
        }

        record.wallet = Number(record.wallet) - amount;
        record.bank = Number(record.bank) + amount;
        await record.save();

        return reply(ctx, successPanel('Depósito realizado', `Depositaste ${formatAmount(amount)} en el banco.`));
    },
};
