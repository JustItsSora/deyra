const { reply, getUserId } = require('../../../lib/reply');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { getBalance, formatAmount } = require('../../../lib/economyUtils');

const UPGRADE_COST_PER_1000 = 500; // cuesta 500 por cada 1000 de capacidad extra
const UPGRADE_AMOUNT = 1000;

module.exports = {
    async execute(ctx) {
        const userId = getUserId(ctx);
        const record = await getBalance(ctx.guild.id, userId);

        if (Number(record.wallet) < UPGRADE_COST_PER_1000) {
            return reply(ctx, { ...errorPanel('Fondos insuficientes', `Necesitas ${formatAmount(UPGRADE_COST_PER_1000)} para mejorar tu banco.`), ephemeral: true });
        }

        record.wallet = Number(record.wallet) - UPGRADE_COST_PER_1000;
        record.bankCapacity = Number(record.bankCapacity) + UPGRADE_AMOUNT;
        await record.save();

        return reply(ctx, successPanel('Banco mejorado', `Tu capacidad de banco aumentó en ${formatAmount(UPGRADE_AMOUNT)}. Nueva capacidad: ${formatAmount(record.bankCapacity)}.`));
    },
};
