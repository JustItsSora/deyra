const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wordshuffle')
        .setDescription('Mezcla las letras de cada palabra en una frase (manteniendo el orden de palabras)')
        .addStringOption(o => o.setName('texto').setDescription('Texto a mezclar').setRequired(true)),

    name: 'wordshuffle',
    aliases: ['mezclarletras'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const text = isSlash(ctx) ? ctx.options.getString('texto') : args.join(' ');
        if (!text) {
            return reply(ctx, { ...errorPanel('Falta el texto', 'Especifica el texto a mezclar.'), ephemeral: true });
        }

        const result = text.split(' ').map(word => {
            const letters = [...word];
            for (let i = letters.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [letters[i], letters[j]] = [letters[j], letters[i]];
            }
            return letters.join('');
        }).join(' ');

        return reply(ctx, infoPanel('Letras mezcladas', result));
    },
};
