const { reply, getUserId } = require('../../../lib/reply');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { getBalance, formatAmount } = require('../../../lib/economyUtils');

const COOLDOWN_MS = 60 * 60 * 1000; // 1 hora
const MIN_REWARD = 100;
const MAX_REWARD = 400;

const JOBS = [
    'Trabajaste como programador y arreglaste un bug crítico',
    'Repartiste pizza por toda la ciudad',
    'Diste clases particulares de matemáticas',
    'Ayudaste en una mudanza',
    'Trabajaste de mesero en un restaurante',
    'Hiciste streaming y conseguiste donaciones',
    'Vendiste artesanías en el mercado',
    'Pasear perros por el vecindario',
];

module.exports = {
    async execute(ctx) {
        const userId = getUserId(ctx);
        const record = await getBalance(ctx.guild.id, userId);
        const now = Date.now();

        if (record.lastWork) {
            const elapsed = now - record.lastWork.getTime();
            if (elapsed < COOLDOWN_MS) {
                const remaining = COOLDOWN_MS - elapsed;
                const minutes = Math.ceil(remaining / 60000);
                return reply(ctx, { ...errorPanel('Estás cansado', `Puedes volver a trabajar en **${minutes} minuto(s)**.`), ephemeral: true });
            }
        }

        const reward = Math.floor(Math.random() * (MAX_REWARD - MIN_REWARD + 1)) + MIN_REWARD;
        const job = JOBS[Math.floor(Math.random() * JOBS.length)];

        record.wallet = Number(record.wallet) + reward;
        record.lastWork = new Date(now);
        await record.save();

        return reply(ctx, successPanel('Trabajo completado', `${job} y ganaste ${formatAmount(reward)}.`));
    },
};
