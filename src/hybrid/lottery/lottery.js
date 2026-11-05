const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { successPanel, errorPanel } = require('../../lib/panel');
const { getBalance, formatAmount } = require('../../lib/economyUtils');

const TICKET_PRICE = 100;
const WIN_CHANCE = 0.1;
const PAYOUT_MULTIPLIER = 8;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lottery')
        .setDescription(`Compra un boleto de lotería por ${TICKET_PRICE} (10% de probabilidad de ganar x${PAYOUT_MULTIPLIER})`),

    name: 'lottery',
    aliases: ['loteria'],
    category: 'economía',
    cooldownMs: 5000,

    async execute(ctx) {
        const userId = getUserId(ctx);
        const record = await getBalance(ctx.guild.id, userId);

        if (Number(record.wallet) < TICKET_PRICE) {
            return reply(ctx, { ...errorPanel('Fondos insuficientes', `Necesitas ${formatAmount(TICKET_PRICE)} para un boleto.`), ephemeral: true });
        }

        record.wallet = Number(record.wallet) - TICKET_PRICE;
        const won = Math.random() < WIN_CHANCE;

        if (won) {
            const prize = TICKET_PRICE * PAYOUT_MULTIPLIER;
            record.wallet = Number(record.wallet) + prize;
            await record.save();
            return reply(ctx, successPanel('🎟️ ¡Ganaste la lotería!', `Ganaste ${formatAmount(prize)}.`));
        }

        await record.save();
        return reply(ctx, errorPanel('🎟️ No hubo suerte', `Perdiste ${formatAmount(TICKET_PRICE)}. Intenta de nuevo.`));
    },
};
