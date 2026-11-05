const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

const QUESTIONS = [
    '¿Cuál ha sido el mejor momento de tu semana?',
    '¿Qué canción no puedes dejar de escuchar últimamente?',
    '¿Cuál es un hobby que te gustaría empezar?',
    '¿Cuál es la mejor serie que has visto este año?',
    '¿Qué es algo que aprendiste recientemente?',
    '¿Cuál es tu lugar favorito para relajarte?',
    '¿Qué meta tienes para este mes?',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('qotd')
        .setDescription('Genera una pregunta del día para el servidor'),

    name: 'qotd',
    aliases: ['preguntadeldia'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx) {
        const question = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
        return reply(ctx, infoPanel('❓ Pregunta del día', question));
    },
};
