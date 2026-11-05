const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('palindrome')
        .setDescription('Verifica si un texto es un palíndromo')
        .addStringOption(o => o.setName('texto').setDescription('Texto a verificar').setRequired(true)),

    name: 'palindrome',
    aliases: ['palindromo'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const text = isSlash(ctx) ? ctx.options.getString('texto') : args.join(' ');
        if (!text) {
            return reply(ctx, { ...errorPanel('Falta el texto', 'Especifica el texto a verificar.'), ephemeral: true });
        }

        const cleaned = text.toLowerCase().replace(/[^a-záéíóúñ0-9]/g, '');
        const reversed = [...cleaned].reverse().join('');
        const isPalindrome = cleaned === reversed;

        return reply(ctx, infoPanel('Verificación de palíndromo', `"${text}" ${isPalindrome ? 'SÍ' : 'NO'} es un palíndromo.`));
    },
};
