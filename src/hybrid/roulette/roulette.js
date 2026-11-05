const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { successPanel, errorPanel } = require('../../lib/panel');
const { getBalance, formatAmount } = require('../../lib/economyUtils');

const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roulette')
        .setDescription('Apuesta en la ruleta: rojo, negro, o un número')
        .addIntegerOption(o => o.setName('cantidad').setDescription('Cantidad a apostar').setMinValue(1).setRequired(true))
        .addStringOption(o => o.setName('apuesta').setDescription('rojo, negro, o un número (0-36)').setRequired(true)),

    name: 'roulette',
    aliases: ['ruleta'],
    category: 'economía',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        const userId = getUserId(ctx);
        let amount, bet;
        if (isSlash(ctx)) {
            amount = ctx.options.getInteger('cantidad');
            bet = ctx.options.getString('apuesta')?.toLowerCase();
        } else {
            amount = parseInt(args[0], 10);
            bet = args[1]?.toLowerCase();
        }

        if (!amount || amount <= 0) {
            return reply(ctx, { ...errorPanel('Cantidad inválida', 'Especifica una cantidad positiva a apostar.'), ephemeral: true });
        }

        const isColorBet = bet === 'rojo' || bet === 'negro';
        const isNumberBet = /^\d+$/.test(bet) && parseInt(bet, 10) >= 0 && parseInt(bet, 10) <= 36;
        if (!isColorBet && !isNumberBet) {
            return reply(ctx, { ...errorPanel('Apuesta inválida', 'Apuesta `rojo`, `negro`, o un número entre 0 y 36.'), ephemeral: true });
        }

        const record = await getBalance(ctx.guild.id, userId);
        if (Number(record.wallet) < amount) {
            return reply(ctx, { ...errorPanel('Fondos insuficientes', `No tienes esa cantidad en tu billetera (tienes ${formatAmount(record.wallet)}).`), ephemeral: true });
        }

        const result = Math.floor(Math.random() * 37); // 0-36
        const resultColor = result === 0 ? 'verde' : RED_NUMBERS.has(result) ? 'rojo' : 'negro';

        let won = false;
        let payout = 0;
        if (isColorBet && bet === resultColor) {
            won = true;
            payout = amount * 2;
        } else if (isNumberBet && parseInt(bet, 10) === result) {
            won = true;
            payout = amount * 35;
        }

        const net = won ? payout - amount : -amount;
        record.wallet = Number(record.wallet) + net;
        await record.save();

        const resultText = `Salió **${result} (${resultColor})**.`;
        return reply(ctx, won
            ? successPanel('🎡 ¡Ganaste!', `${resultText}\nGanaste ${formatAmount(payout)}.`)
            : errorPanel('🎡 Perdiste', `${resultText}\nPerdiste ${formatAmount(amount)}.`));
    },
};
