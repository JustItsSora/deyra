const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

const MOVIES = ['Interestelar', 'El Padrino', 'Parásitos', 'Coco', 'Inception', 'Spider-Man: Into the Spider-Verse', 'La La Land', 'El Gran Hotel Budapest', 'Whiplash', 'Your Name'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('movienight')
        .setDescription('Sugiere una película aleatoria para ver esta noche'),

    name: 'movienight',
    aliases: ['pelicula'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx) {
        const movie = MOVIES[Math.floor(Math.random() * MOVIES.length)];
        return reply(ctx, infoPanel('🎬 Sugerencia de película', `Esta noche podrías ver: **${movie}**`));
    },
};
