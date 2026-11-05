const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

const TOPICS = [
    '¿Es mejor el desayuno dulce o salado?',
    '¿La pizza con piña es una buena combinación?',
    '¿Es mejor ver una serie de una sola vez o por episodios semanales?',
    '¿Los libros son siempre mejores que sus adaptaciones?',
    '¿Es mejor trabajar desde casa o en oficina?',
    '¿Los perros son mejores mascotas que los gatos?',
    '¿Es más importante el talento o el esfuerzo?',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('debate')
        .setDescription('Genera un tema de debate aleatorio para el servidor'),

    name: 'debate',
    aliases: [],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx) {
        const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
        return reply(ctx, infoPanel('🗣️ Tema de debate', topic));
    },
};
