const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { successPanel, errorPanel } = require('../../lib/panel');
const { getBalance, formatAmount } = require('../../lib/economyUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('highlow')
        .setDescription('Apuesta si la siguiente carta (1-13) será más alta o más baja')
        .addIntegerOption(o => o.setName('cantidad').setDescription('Cantidad a apostar').setMinValue(1).setRequired(true))
        .addStringOption(o => o.setName('prediccion').setDescription('high o low').setRequired(true).addChoices({ name: 'Más alta', value: 'high' }, { name: 'Más baja', value: 'low' })),

    name: 'highlow',
    aliases: ['hl'],
    category: 'economía',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        const userId = getUserId(ctx);
        let amount, prediction;
        if (isSlash(ctx)) {
            amount = ctx.options.getInteger('cantidad');
            prediction = ctx.options.getString('prediccion');
        } else {
            amount = parseInt(args[0], 10);
            prediction = args[1]?.toLowerCase();
        }

        if (!amount || amount <= 0 || !['high', 'low'].includes(prediction)) {
            return reply(ctx, { ...errorPanel('Datos inválidos', 'Uso: `/highlow cantidad:<n> prediccion:<high|low>`'), ephemeral: true });
        }

        const record = await getBalance(ctx.guild.id, userId);
        if (Number(record.wallet) < amount) {
            return reply(ctx, { ...errorPanel('Fondos insuficientes', `No tienes esa cantidad (tienes ${formatAmount(record.wallet)}).`), ephemeral: true });
        }

        const first = Math.floor(Math.random() * 13) + 1;
        const second = Math.floor(Math.random() * 13) + 1;

        const actual = second > first ? 'high' : second < first ? 'low' : 'tie';
        const won = actual === prediction;

        const net = actual === 'tie' ? 0 : won ? amount : -amount;
        record.wallet = Number(record.wallet) + net;
        await record.save();

        const summary = `Primera carta: **${first}** → Segunda carta: **${second}**`;
        if (actual === 'tie') return reply(ctx, errorPanel('Empate', `${summary}\nSe devuelve tu apuesta.`));
        return reply(ctx, won
            ? successPanel('¡Ganaste!', `${summary}\nGanaste ${formatAmount(amount)}.`)
            : errorPanel('Perdiste', `${summary}\nPerdiste ${formatAmount(amount)}.`));
    },
};
