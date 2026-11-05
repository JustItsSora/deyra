const { reply, getUserId } = require('../../../lib/reply');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { getBalance, formatAmount } = require('../../../lib/economyUtils');

const COOLDOWN_MS = 45 * 60 * 1000;
const SUCCESS_CHANCE = 0.4;
const MIN_WALLET_TO_BE_ROBBED = 200;
const STEAL_PERCENT_MIN = 0.1;
const STEAL_PERCENT_MAX = 0.3;
const FAIL_FINE_PERCENT = 0.15;

module.exports = {
    async execute(ctx) {
        const executorId = getUserId(ctx);
        const targetId = ctx.options?.getUser('usuario')?.id;
        if (!targetId) {
            return reply(ctx, { ...errorPanel('Falta el objetivo', 'Este comando solo está disponible como slash command con un usuario especificado.'), ephemeral: true });
        }
        if (targetId === executorId) {
            return reply(ctx, { ...errorPanel('No puedes hacer eso', 'No puedes robarte a ti mismo.'), ephemeral: true });
        }

        const robber = await getBalance(ctx.guild.id, executorId);
        const now = Date.now();

        if (robber.lastRob) {
            const elapsed = now - robber.lastRob.getTime();
            if (elapsed < COOLDOWN_MS) {
                const remaining = Math.ceil((COOLDOWN_MS - elapsed) / 60000);
                return reply(ctx, { ...errorPanel('Muy pronto', `Espera **${remaining} minuto(s)** antes de intentar otro robo.`), ephemeral: true });
            }
        }

        const victim = await getBalance(ctx.guild.id, targetId);
        robber.lastRob = new Date(now);

        if (Number(victim.wallet) < MIN_WALLET_TO_BE_ROBBED) {
            await robber.save();
            return reply(ctx, { ...errorPanel('Objetivo muy pobre', 'Esa persona no tiene suficiente dinero en la billetera para valer la pena.'), ephemeral: true });
        }

        const success = Math.random() < SUCCESS_CHANCE;

        if (success) {
            const percent = STEAL_PERCENT_MIN + Math.random() * (STEAL_PERCENT_MAX - STEAL_PERCENT_MIN);
            const amount = Math.floor(Number(victim.wallet) * percent);

            victim.wallet = Number(victim.wallet) - amount;
            robber.wallet = Number(robber.wallet) + amount;
            await Promise.all([victim.save(), robber.save()]);

            return reply(ctx, successPanel('Robo exitoso', `Le robaste ${formatAmount(amount)} a <@${targetId}>.`));
        }

        const fine = Math.floor(Number(robber.wallet) * FAIL_FINE_PERCENT);
        robber.wallet = Math.max(0, Number(robber.wallet) - fine);
        await robber.save();

        return reply(ctx, errorPanel('Te atraparon', `Fallaste el robo y pagaste una multa de ${formatAmount(fine)}.`));
    },
};
