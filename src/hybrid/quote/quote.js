const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

const QUOTES = [
    { text: 'El único modo de hacer un gran trabajo es amar lo que haces.', author: 'Steve Jobs' },
    { text: 'La vida es lo que pasa mientras estás ocupado haciendo otros planes.', author: 'John Lennon' },
    { text: 'El éxito es ir de fracaso en fracaso sin perder el entusiasmo.', author: 'Winston Churchill' },
    { text: 'No cuentes los días, haz que los días cuenten.', author: 'Muhammad Ali' },
    { text: 'La imaginación es más importante que el conocimiento.', author: 'Albert Einstein' },
    { text: 'El futuro pertenece a quienes creen en la belleza de sus sueños.', author: 'Eleanor Roosevelt' },
    { text: 'Hazlo o no lo hagas, pero no lo intentes.', author: 'Yoda' },
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quote')
        .setDescription('Comparte una frase inspiradora aleatoria'),

    name: 'quote',
    aliases: ['frase'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx) {
        const pick = QUOTES[Math.floor(Math.random() * QUOTES.length)];
        return reply(ctx, infoPanel('💬 Frase', `*"${pick.text}"*\n— ${pick.author}`));
    },
};
