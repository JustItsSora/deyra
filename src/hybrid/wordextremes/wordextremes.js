const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wordextremes')
        .setDescription('Encuentra la palabra más larga y más corta de un texto')
        .addStringOption(o => o.setName('texto').setDescription('Texto a analizar').setRequired(true)),

    name: 'wordextremes',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const text = isSlash(ctx) ? ctx.options.getString('texto') : args.join(' ');
        if (!text) {
            return reply(ctx, { ...errorPanel('Falta el texto', 'Especifica el texto a analizar.'), ephemeral: true });
        }

        const words = text.trim().split(/\s+/);
        const longest = words.reduce((max, w) => (w.length > max.length ? w : max), words[0]);
        const shortest = words.reduce((min, w) => (w.length < min.length ? w : min), words[0]);

        return reply(ctx, infoPanel('Extremos de palabras', `**Más larga:** ${longest} (${longest.length} letras)\n**Más corta:** ${shortest} (${shortest.length} letras)`));
    },
};
