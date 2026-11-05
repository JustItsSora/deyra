const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

const PROMPTS = [
    'salido de fiesta hasta el amanecer',
    'mentido sobre mi edad',
    'llorado viendo una película',
    'comido comida que se cayó al piso',
    'fingido estar enfermo para no ir a trabajar/estudiar',
    'hablado solo en voz alta en público',
    'tenido una cita a ciegas',
    'roto algo y culpado a otra persona',
    'cantado en la ducha a todo volumen',
    'dormido en clase o en una reunión',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('neverhave')
        .setDescription('Genera una frase de "nunca he..." para jugar con amigos'),

    name: 'neverhave',
    aliases: ['nuncahe'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx) {
        const prompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
        return reply(ctx, infoPanel('🙊 Nunca he...', prompt));
    },
};
