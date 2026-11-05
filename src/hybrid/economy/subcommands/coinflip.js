const { reply, isSlash, getUserId } = require('../../../lib/reply');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { getBalance, formatAmount } = require('../../../lib/economyUtils');

module.exports = {
    async execute(ctx, args) {
        const userId = getUserId(ctx);

        let amount, choice;
        if (isSlash(ctx)) {
            amount = ctx.options.getInteger('cantidad');
            choice = ctx.options.getString('eleccion');
        } else {
            amount = parseInt(args[0], 10);
            choice = args[1]?.toLowerCase() === 'cruz' ? 'tails' : 'heads';
        }

        if (!amount || amount <= 0) {
            return reply(ctx, { ...errorPanel('Cantidad inválida', 'Especifica una cantidad positiva a apostar.'), ephemeral: true });
        }

        const record = await getBalance(ctx.guild.id, userId);
        if (Number(record.wallet) < amount) {
            return reply(ctx, { ...errorPanel('Fondos insuficientes', `No tienes esa cantidad en tu billetera (tienes ${formatAmount(record.wallet)}).`), ephemeral: true });
        }

        const result = Math.random() < 0.5 ? 'heads' : 'tails';
        const won = result === choice;
        const resultLabel = result === 'heads' ? 'Cara' : 'Cruz';

        record.wallet = Number(record.wallet) + (won ? amount : -amount);
        await record.save();

        return reply(ctx, won
            ? successPanel('¡Ganaste!', `Salió **${resultLabel}**. Ganaste ${formatAmount(amount)}.`)
            : errorPanel('Perdiste', `Salió **${resultLabel}**. Perdiste ${formatAmount(amount)}.`));
    },
};
