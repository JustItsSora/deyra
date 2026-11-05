const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wordlength')
        .setDescription('Muestra la longitud de cada palabra en un texto')
        .addStringOption(o => o.setName('texto').setDescription('Texto a analizar').setRequired(true)),

    name: 'wordlength',
    aliases: ['longitudpalabras'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const text = isSlash(ctx) ? ctx.options.getString('texto') : args.join(' ');
        if (!text) {
            return reply(ctx, { ...errorPanel('Falta el texto', 'Especifica el texto a analizar.'), ephemeral: true });
        }

        const words = text.trim().split(/\s+/);
        const lines = words.map(w => `**${w}**: ${w.length} letra(s)`);

        return reply(ctx, infoPanel('Longitud de palabras', undefined, { lines }));
    },
};
