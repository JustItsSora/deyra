const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

const AFFIRMATIONS = [
    'Soy capaz de superar cualquier desafío.',
    'Merezco felicidad y éxito.',
    'Cada día mejoro un poco más.',
    'Tengo el control de mis decisiones.',
    'Soy suficiente tal como soy.',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('affirmation')
        .setDescription('Recibe una afirmación positiva aleatoria'),

    name: 'affirmation',
    aliases: ['afirmacion'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx) {
        const affirmation = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];
        return reply(ctx, infoPanel('🌟 Afirmación', affirmation));
    },
};
