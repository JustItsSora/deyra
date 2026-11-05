const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

const WORDS = ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lorem')
        .setDescription('Genera texto de relleno Lorem Ipsum')
        .addIntegerOption(o => o.setName('palabras').setDescription('Cantidad de palabras (default 30)').setMinValue(5).setMaxValue(200).setRequired(false)),

    name: 'lorem',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const count = isSlash(ctx) ? (ctx.options.getInteger('palabras') || 30) : (parseInt(args[0], 10) || 30);
        const clamped = Math.min(200, Math.max(5, count));

        const text = Array.from({ length: clamped }, () => WORDS[Math.floor(Math.random() * WORDS.length)]).join(' ');
        const capitalized = text.charAt(0).toUpperCase() + text.slice(1) + '.';

        return reply(ctx, infoPanel('Lorem Ipsum', capitalized));
    },
};
