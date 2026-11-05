const { reply, getUserId } = require('../../../lib/reply');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { getBalance, formatAmount } = require('../../../lib/economyUtils');

const COOLDOWN_MS = 30 * 60 * 1000;
const SUCCESS_CHANCE = 0.55;
const MIN_REWARD = 200;
const MAX_REWARD = 900;
const MIN_FINE = 100;
const MAX_FINE = 500;

const CRIMES_SUCCESS = [
    'Asaltaste un banco sin ser detectado',
    'Hackeaste una cuenta y transferiste fondos',
    'Vendiste objetos robados en el mercado negro',
];
const CRIMES_FAIL = [
    'Intentaste robar una tienda pero te atraparon',
    'La policía te encontró antes de escapar',
    'Un testigo te delató',
];

module.exports = {
    async execute(ctx) {
        const userId = getUserId(ctx);
        const record = await getBalance(ctx.guild.id, userId);
        const now = Date.now();

        if (record.lastCrime) {
            const elapsed = now - record.lastCrime.getTime();
            if (elapsed < COOLDOWN_MS) {
                const remaining = COOLDOWN_MS - elapsed;
                const minutes = Math.ceil(remaining / 60000);
                return reply(ctx, { ...errorPanel('Muy pronto', `Espera **${minutes} minuto(s)** antes de intentar otro golpe.`), ephemeral: true });
            }
        }

        record.lastCrime = new Date(now);
        const success = Math.random() < SUCCESS_CHANCE;

        if (success) {
            const reward = Math.floor(Math.random() * (MAX_REWARD - MIN_REWARD + 1)) + MIN_REWARD;
            record.wallet = Number(record.wallet) + reward;
            await record.save();
            const msg = CRIMES_SUCCESS[Math.floor(Math.random() * CRIMES_SUCCESS.length)];
            return reply(ctx, successPanel('Crimen exitoso', `${msg}. Ganaste ${formatAmount(reward)}.`));
        }

        const fine = Math.floor(Math.random() * (MAX_FINE - MIN_FINE + 1)) + MIN_FINE;
        record.wallet = Math.max(0, Number(record.wallet) - fine);
        await record.save();
        const msg = CRIMES_FAIL[Math.floor(Math.random() * CRIMES_FAIL.length)];
        return reply(ctx, errorPanel('Te atraparon', `${msg}. Pagaste una multa de ${formatAmount(fine)}.`));
    },
};
