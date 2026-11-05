const { reply, isSlash, getUserId } = require('../../../lib/reply');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { getBalance, formatAmount } = require('../../../lib/economyUtils');

const SYMBOLS = ['🍒', '🍋', '🍊', '🍉', '⭐', '💎'];
const PAYOUT_MULTIPLIER = { triple: 5, double: 1.5 };

module.exports = {
    async execute(ctx, args) {
        const userId = getUserId(ctx);
        const amount = isSlash(ctx) ? ctx.options.getInteger('cantidad') : parseInt(args[0], 10);

        if (!amount || amount <= 0) {
            return reply(ctx, { ...errorPanel('Cantidad inválida', 'Especifica una cantidad positiva a apostar.'), ephemeral: true });
        }

        const record = await getBalance(ctx.guild.id, userId);
        if (Number(record.wallet) < amount) {
            return reply(ctx, { ...errorPanel('Fondos insuficientes', `No tienes esa cantidad en tu billetera (tienes ${formatAmount(record.wallet)}).`), ephemeral: true });
        }

        const roll = () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
        const [a, b, c] = [roll(), roll(), roll()];
        const display = `[ ${a} | ${b} | ${c} ]`;

        let winnings = 0;
        if (a === b && b === c) winnings = Math.floor(amount * PAYOUT_MULTIPLIER.triple);
        else if (a === b || b === c || a === c) winnings = Math.floor(amount * PAYOUT_MULTIPLIER.double);

        const net = winnings - amount;
        record.wallet = Number(record.wallet) + net;
        await record.save();

        if (winnings > 0) {
            return reply(ctx, successPanel('¡Ganaste!', `${display}\nGanaste ${formatAmount(winnings)} (neto: ${formatAmount(net)}).`));
        }
        return reply(ctx, errorPanel('Sin suerte', `${display}\nPerdiste ${formatAmount(amount)}.`));
    },
};
