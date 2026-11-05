const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

const WORDS_PER_MINUTE = 200;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('readingtime')
        .setDescription('Estima el tiempo de lectura de un texto')
        .addStringOption(o => o.setName('texto').setDescription('Texto a analizar').setRequired(true)),

    name: 'readingtime',
    aliases: ['tiempolectura'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const text = isSlash(ctx) ? ctx.options.getString('texto') : args.join(' ');
        if (!text) {
            return reply(ctx, { ...errorPanel('Falta el texto', 'Especifica el texto a analizar.'), ephemeral: true });
        }

        const words = text.trim().split(/\s+/).filter(Boolean).length;
        const minutes = Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));

        return reply(ctx, infoPanel('⏱️ Tiempo de lectura estimado', `**${words}** palabras — aproximadamente **${minutes} minuto(s)** de lectura.`));
    },
};
