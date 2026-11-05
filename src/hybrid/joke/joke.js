const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

const FALLBACK_JOKES = [
    '¿Por qué los programadores prefieren el frío? Porque odian los bugs.',
    '¿Qué le dice un bit al otro? Nos vemos en el bus.',
    '¿Por qué el libro de matemáticas está triste? Porque tiene demasiados problemas.',
    '¿Cómo se llama un boomerang que no vuelve? Un palo.',
    '¿Qué hace una abeja en el gimnasio? Zum-ba.',
];

async function fetchDadJoke() {
    const res = await fetch('https://icanhazdadjoke.com/', { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`icanhazdadjoke ${res.status}`);
    const data = await res.json();
    if (!data.joke) throw new Error('Sin joke en la respuesta');
    return data.joke;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('joke')
        .setDescription('Cuenta un chiste aleatorio'),

    name: 'joke',
    aliases: ['chiste'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx) {
        let joke;
        try {
            joke = await fetchDadJoke();
        } catch {
            joke = FALLBACK_JOKES[Math.floor(Math.random() * FALLBACK_JOKES.length)];
        }
        return reply(ctx, infoPanel('😂 Chiste', joke));
    },
};
