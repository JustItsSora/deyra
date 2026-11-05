const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

const FALLBACK_FACTS = [
    'Los pulpos tienen tres corazones.',
    'La miel nunca se echa a perder si se almacena correctamente.',
    'Un grupo de flamencos se llama "flamboyance".',
    'El corazón de una ballena azul pesa tanto como un auto pequeño.',
    'Las estrellas de mar no tienen cerebro.',
];

async function fetchFact() {
    const res = await fetch('https://uselessfacts.jsph.pl/api/v2/facts/random?language=en');
    if (!res.ok) throw new Error(`uselessfacts ${res.status}`);
    const data = await res.json();
    if (!data.text) throw new Error('Sin texto en la respuesta');
    return data.text;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fact')
        .setDescription('Comparte un dato curioso aleatorio'),

    name: 'fact',
    aliases: ['dato'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx) {
        let fact;
        try {
            fact = await fetchFact();
        } catch {
            fact = FALLBACK_FACTS[Math.floor(Math.random() * FALLBACK_FACTS.length)];
        }
        return reply(ctx, infoPanel('🧠 Dato curioso', fact));
    },
};
