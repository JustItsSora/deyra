const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

const LEET_MAP = { a: '4', e: '3', i: '1', o: '0', s: '5', t: '7', l: '1', g: '9' };

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leet')
        .setDescription('Convierte texto a 1337speak')
        .addStringOption(o => o.setName('texto').setDescription('Texto a convertir').setRequired(true)),

    name: 'leet',
    aliases: ['1337'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const text = isSlash(ctx) ? ctx.options.getString('texto') : args.join(' ');
        if (!text) {
            return reply(ctx, { ...errorPanel('Falta el texto', 'Especifica el texto a convertir.'), ephemeral: true });
        }

        const result = [...text.toLowerCase()].map(c => LEET_MAP[c] || c).join('');
        return reply(ctx, infoPanel('1337 5p34k', result));
    },
};
