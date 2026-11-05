const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { successPanel, errorPanel } = require('../../lib/panel');
const { getBalance, formatAmount } = require('../../lib/economyUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('crash')
        .setDescription('Apuesta con un multiplicador creciente que puede "crashear" en cualquier momento')
        .addIntegerOption(o => o.setName('cantidad').setDescription('Cantidad a apostar').setMinValue(1).setRequired(true))
        .addNumberOption(o => o.setName('objetivo').setDescription('Multiplicador objetivo al que quieres retirarte (ej: 2.0)').setMinValue(1.1).setMaxValue(50).setRequired(true)),

    name: 'crash',
    aliases: [],
    category: 'economía',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        const userId = getUserId(ctx);
        let amount, target;
        if (isSlash(ctx)) {
            amount = ctx.options.getInteger('cantidad');
            target = ctx.options.getNumber('objetivo');
        } else {
            amount = parseInt(args[0], 10);
            target = parseFloat(args[1]);
        }

        if (!amount || amount <= 0 || !target || target < 1.1) {
            return reply(ctx, { ...errorPanel('Datos inválidos', 'Uso: `/crash cantidad:<n> objetivo:<multiplicador>`'), ephemeral: true });
        }

        const record = await getBalance(ctx.guild.id, userId);
        if (Number(record.wallet) < amount) {
            return reply(ctx, { ...errorPanel('Fondos insuficientes', `No tienes esa cantidad (tienes ${formatAmount(record.wallet)}).`), ephemeral: true });
        }

        // El punto de "crash" sigue una distribución donde multiplicadores altos son cada vez más raros.
        const crashPoint = 1 / (1 - Math.random()) ** 0.5;
        const won = crashPoint >= target;

        const net = won ? Math.floor(amount * (target - 1)) : -amount;
        record.wallet = Number(record.wallet) + net;
        await record.save();

        const crashDisplay = crashPoint.toFixed(2);
        return reply(ctx, won
            ? successPanel('📈 ¡Te retiraste a tiempo!', `Crasheó en x${crashDisplay}, te retiraste en x${target}.\nGanaste ${formatAmount(net)}.`)
            : errorPanel('📉 Crash', `Crasheó en x${crashDisplay} antes de llegar a tu objetivo de x${target}.\nPerdiste ${formatAmount(amount)}.`));
    },
};
