const { reply, getUserId } = require('../../../lib/reply');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { getBalance, formatAmount } = require('../../../lib/economyUtils');

const REWARD = 3000;
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

module.exports = {
    async execute(ctx) {
        const userId = getUserId(ctx);
        const record = await getBalance(ctx.guild.id, userId);
        const now = Date.now();

        if (record.lastWeekly) {
            const elapsed = now - record.lastWeekly.getTime();
            if (elapsed < COOLDOWN_MS) {
                const remaining = COOLDOWN_MS - elapsed;
                const days = Math.floor(remaining / 86400000);
                const hours = Math.floor((remaining % 86400000) / 3600000);
                return reply(ctx, { ...errorPanel('Ya reclamaste tu semanal', `Vuelve en **${days}d ${hours}h**.`), ephemeral: true });
            }
        }

        record.wallet = Number(record.wallet) + REWARD;
        record.lastWeekly = new Date(now);
        await record.save();

        return reply(ctx, successPanel('Recompensa semanal reclamada', `Recibiste ${formatAmount(REWARD)}.`));
    },
};
