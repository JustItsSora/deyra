const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

// Free Dictionary API — gratuita, sin key. Solo soporta inglés de forma confiable.
async function fetchDefinition(word) {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    if (!res.ok) throw new Error(`dictionaryapi ${res.status}`);
    const data = await res.json();
    return data[0];
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('define')
        .setDescription('Busca la definición de una palabra en inglés')
        .addStringOption(o => o.setName('palabra').setDescription('Palabra a definir (en inglés)').setRequired(true)),

    name: 'define',
    aliases: ['definir'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const word = isSlash(ctx) ? ctx.options.getString('palabra') : args[0];
        if (!word) {
            return reply(ctx, { ...errorPanel('Falta la palabra', 'Especifica una palabra a definir.'), ephemeral: true });
        }

        let entry;
        try {
            entry = await fetchDefinition(word);
        } catch {
            return reply(ctx, { ...errorPanel('No encontrada', 'No encontré una definición para esa palabra (recuerda que este comando funciona en inglés).'), ephemeral: true });
        }

        const meaning = entry.meanings?.[0];
        const definition = meaning?.definitions?.[0]?.definition || 'Sin definición disponible.';
        const partOfSpeech = meaning?.partOfSpeech || '';
        const phonetic = entry.phonetic || '';

        return reply(ctx, infoPanel(`📖 ${entry.word}${phonetic ? ` (${phonetic})` : ''}`, `*${partOfSpeech}*\n${definition}`));
    },
};
