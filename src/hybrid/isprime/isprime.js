const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

function isPrime(n) {
    if (n < 2) return false;
    for (let i = 2; i * i <= n; i++) {
        if (n % i === 0) return false;
    }
    return true;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('isprime')
        .setDescription('Verifica si un número es primo')
        .addIntegerOption(o => o.setName('numero').setDescription('Número a verificar').setRequired(true)),

    name: 'isprime',
    aliases: ['esprimo'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const n = isSlash(ctx) ? ctx.options.getInteger('numero') : parseInt(args[0], 10);
        if (Number.isNaN(n) || n < 0 || n > 1e12) {
            return reply(ctx, { ...errorPanel('Valor inválido', 'Especifica un número entero válido.'), ephemeral: true });
        }

        const result = isPrime(n);
        return reply(ctx, infoPanel('Número primo', `**${n}** ${result ? 'ES' : 'NO es'} un número primo.`));
    },
};
