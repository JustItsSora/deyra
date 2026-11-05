const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { successPanel, errorPanel, infoPanel } = require('../../lib/panel');
const { getBalance, formatAmount } = require('../../lib/economyUtils');

function drawCard() {
    const values = [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10, 11]; // J/Q/K = 10, A = 11 (simplificado)
    return values[Math.floor(Math.random() * values.length)];
}

function handValue(cards) {
    let total = cards.reduce((a, b) => a + b, 0);
    let aces = cards.filter(c => c === 11).length;
    while (total > 21 && aces > 0) {
        total -= 10;
        aces -= 1;
    }
    return total;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blackjack')
        .setDescription('Juega blackjack simplificado contra la casa')
        .addIntegerOption(o => o.setName('cantidad').setDescription('Cantidad a apostar').setMinValue(1).setRequired(true)),

    name: 'blackjack',
    aliases: ['bj'],
    category: 'economía',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        const userId = getUserId(ctx);
        const amount = isSlash(ctx) ? ctx.options.getInteger('cantidad') : parseInt(args[0], 10);

        if (!amount || amount <= 0) {
            return reply(ctx, { ...errorPanel('Cantidad inválida', 'Especifica una cantidad positiva a apostar.'), ephemeral: true });
        }

        const record = await getBalance(ctx.guild.id, userId);
        if (Number(record.wallet) < amount) {
            return reply(ctx, { ...errorPanel('Fondos insuficientes', `No tienes esa cantidad en tu billetera (tienes ${formatAmount(record.wallet)}).`), ephemeral: true });
        }

        // Simplificado: sin hit/stand interactivo, se resuelve de inmediato comparando manos iniciales de 2 cartas.
        const playerHand = [drawCard(), drawCard()];
        const dealerHand = [drawCard(), drawCard()];

        let playerTotal = handValue(playerHand);
        let dealerTotal = handValue(dealerHand);

        // La casa pide carta hasta 17+.
        while (dealerTotal < 17) {
            dealerHand.push(drawCard());
            dealerTotal = handValue(dealerHand);
        }

        const summary = `**Tu mano:** ${playerHand.join(', ')} (${playerTotal})\n**Casa:** ${dealerHand.join(', ')} (${dealerTotal})`;

        let outcome, net;
        if (playerTotal > 21) {
            outcome = 'Te pasaste de 21. Perdiste.';
            net = -amount;
        } else if (dealerTotal > 21 || playerTotal > dealerTotal) {
            outcome = '¡Ganaste!';
            net = amount;
        } else if (playerTotal === dealerTotal) {
            outcome = 'Empate, se devuelve tu apuesta.';
            net = 0;
        } else {
            outcome = 'La casa gana.';
            net = -amount;
        }

        record.wallet = Number(record.wallet) + net;
        await record.save();

        const panelFn = net > 0 ? successPanel : net < 0 ? errorPanel : infoPanel;
        return reply(ctx, panelFn('🃏 Blackjack', `${summary}\n\n${outcome}${net !== 0 ? ` (${formatAmount(Math.abs(net))})` : ''}`));
    },
};
