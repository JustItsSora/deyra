const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

// Random Word API pública, gratis, sin key.
async function fetchRandomWord() {
    const res = await fetch('https://random-word-api.herokuapp.com/word');
    if (!res.ok) throw new Error(`random-word-api ${res.status}`);
    const data = await res.json();
    return data[0];
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('randomword')
        .setDescription('Muestra una palabra aleatoria en inglés'),

    name: 'randomword',
    aliases: ['palabraaleatoria'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx) {
        try {
            const word = await fetchRandomWord();
            return reply(ctx, infoPanel('📝 Palabra aleatoria', `**${word}**`));
        } catch (err) {
            console.error('[randomword] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude obtener una palabra aleatoria en este momento.'), ephemeral: true });
        }
    },
};
