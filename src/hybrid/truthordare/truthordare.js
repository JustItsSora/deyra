const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

const TRUTHS = [
    '¿Cuál es tu mayor miedo?',
    '¿Cuál ha sido tu mentira más grande?',
    '¿Qué es lo más vergonzoso que te ha pasado?',
    '¿Cuál es tu secreto mejor guardado?',
    '¿A quién admiras más y por qué?',
    '¿Cuál fue tu primer amor?',
    '¿Qué es lo que más te arrepientes de haber hecho?',
];

const DARES = [
    'Escribe tu próximo mensaje solo con emojis.',
    'Cambia tu apodo a algo gracioso por 10 minutos.',
    'Cuenta un chiste malo en el chat.',
    'Envía el último emoji que usaste sin contexto.',
    'Describe tu día usando solo 5 palabras.',
    'Imita a otro miembro del servidor (con respeto).',
    'Escribe tu mensaje al revés.',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('truthordare')
        .setDescription('Verdad o reto — genera uno aleatorio')
        .addStringOption(o => o.setName('tipo').setDescription('Verdad o reto').setRequired(false)
            .addChoices({ name: 'Verdad', value: 'truth' }, { name: 'Reto', value: 'dare' })),

    name: 'truthordare',
    aliases: ['vor', 'verdadoreto'],
    category: 'diversión',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        let type = isSlash(ctx) ? ctx.options.getString('tipo') : args[0]?.toLowerCase();
        if (!['truth', 'dare'].includes(type)) {
            type = Math.random() < 0.5 ? 'truth' : 'dare';
        }

        const pool = type === 'truth' ? TRUTHS : DARES;
        const pick = pool[Math.floor(Math.random() * pool.length)];

        return reply(ctx, infoPanel(type === 'truth' ? '🗣️ Verdad' : '😈 Reto', pick));
    },
};
