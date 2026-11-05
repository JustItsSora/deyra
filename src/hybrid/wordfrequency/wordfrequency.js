const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wordfrequency')
        .setDescription('Muestra qué tan frecuente es cada palabra en un texto')
        .addStringOption(o => o.setName('texto').setDescription('Texto a analizar').setRequired(true)),

    name: 'wordfrequency',
    aliases: ['frecuenciapalabras'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const text = isSlash(ctx) ? ctx.options.getString('texto') : args.join(' ');
        if (!text) {
            return reply(ctx, { ...errorPanel('Falta el texto', 'Especifica el texto a analizar.'), ephemeral: true });
        }

        const words = text.toLowerCase().match(/[a-záéíóúñ]+/g) || [];
        const counts = words.reduce((acc, w) => { acc[w] = (acc[w] || 0) + 1; return acc; }, {});
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);

        if (sorted.length === 0) {
            return reply(ctx, infoPanel('Frecuencia de palabras', 'No encontré palabras para analizar.'));
        }

        const lines = sorted.map(([word, count]) => `**${word}**: ${count} vez/veces`);
        return reply(ctx, infoPanel('Frecuencia de palabras (top 10)', undefined, { lines }));
    },
};
