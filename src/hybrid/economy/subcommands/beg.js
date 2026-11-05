const { reply, getUserId } = require('../../../lib/reply');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { getBalance, formatAmount } = require('../../../lib/economyUtils');

const COOLDOWN_MS = 10 * 60 * 1000;
const MIN_REWARD = 10;
const MAX_REWARD = 80;
const NOTHING_CHANCE = 0.25;

const LINES = [
    'Un desconocido te dio unas monedas',
    'Alguien sintió lástima y te dio dinero',
    'Encontraste algo de dinero en el suelo',
];

module.exports = {
    async execute(ctx) {
        const userId = getUserId(ctx);
        const record = await getBalance(ctx.guild.id, userId);
        const now = Date.now();

        if (record.lastBeg) {
            const elapsed = now - record.lastBeg.getTime();
            if (elapsed < COOLDOWN_MS) {
                const remaining = Math.ceil((COOLDOWN_MS - elapsed) / 60000);
                return reply(ctx, { ...errorPanel('Muy pronto', `Espera **${remaining} minuto(s)**.`), ephemeral: true });
            }
        }

        if (Math.random() < NOTHING_CHANCE) {
            record.lastBeg = new Date(now);
            await record.save();
            return reply(ctx, errorPanel('Nadie te dio nada', 'Intenta de nuevo más tarde.'));
        }

        const reward = Math.floor(Math.random() * (MAX_REWARD - MIN_REWARD + 1)) + MIN_REWARD;
        record.wallet = Number(record.wallet) + reward;
        record.lastBeg = new Date(now);
        await record.save();

        const msg = LINES[Math.floor(Math.random() * LINES.length)];
        return reply(ctx, successPanel('Limosna recibida', `${msg}. Ganaste ${formatAmount(reward)}.`));
    },
};
