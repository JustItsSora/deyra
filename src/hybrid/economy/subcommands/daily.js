const { reply, getUserId } = require('../../../lib/reply');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { getBalance, formatAmount } = require('../../../lib/economyUtils');

const BASE_REWARD = 500;
const STREAK_BONUS = 50; // por cada día consecutivo, hasta un máximo
const MAX_STREAK_BONUS_DAYS = 10;
const COOLDOWN_MS = 24 * 60 * 60 * 1000;
const GRACE_MS = 48 * 60 * 60 * 1000; // si pasan más de 48h, se rompe la racha

module.exports = {
    async execute(ctx) {
        const userId = getUserId(ctx);
        const record = await getBalance(ctx.guild.id, userId);
        const now = Date.now();

        if (record.lastDaily) {
            const elapsed = now - record.lastDaily.getTime();
            if (elapsed < COOLDOWN_MS) {
                const remaining = COOLDOWN_MS - elapsed;
                const hours = Math.floor(remaining / 3600000);
                const minutes = Math.floor((remaining % 3600000) / 60000);
                return reply(ctx, { ...errorPanel('Ya reclamaste tu diario', `Vuelve en **${hours}h ${minutes}m**.`), ephemeral: true });
            }
            if (elapsed > GRACE_MS) {
                record.dailyStreak = 0;
            }
        }

        record.dailyStreak = Math.min(record.dailyStreak + 1, MAX_STREAK_BONUS_DAYS);
        const bonus = record.dailyStreak * STREAK_BONUS;
        const total = BASE_REWARD + bonus;

        record.wallet = Number(record.wallet) + total;
        record.lastDaily = new Date(now);
        await record.save();

        return reply(ctx, successPanel(
            'Recompensa diaria reclamada',
            `Recibiste ${formatAmount(total)} (base ${formatAmount(BASE_REWARD)} + racha ${formatAmount(bonus)}).\n**Racha actual:** ${record.dailyStreak} día(s).`,
        ));
    },
};
