const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

const QUESTIONS = [
    '¿Cuál es tu película favorita de todos los tiempos?',
    'Si pudieras viajar a cualquier lugar ahora mismo, ¿a dónde irías?',
    '¿Cuál es la habilidad más inútil que tienes?',
    'Si fueras un animal, ¿cuál serías y por qué?',
    '¿Cuál es tu comida favorita que la gente odia?',
    '¿Qué superpoder elegirías y por qué?',
    '¿Cuál fue tu primer trabajo?',
    'Si ganaras la lotería, ¿qué es lo primero que harías?',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('icebreaker')
        .setDescription('Genera una pregunta para romper el hielo en el servidor'),

    name: 'icebreaker',
    aliases: ['romperelhielo'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx) {
        const question = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
        return reply(ctx, infoPanel('🧊 Rompehielos', question));
    },
};
