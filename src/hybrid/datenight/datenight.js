const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

const IDEAS = ['Cena y una caminata al atardecer', 'Noche de juegos de mesa en casa', 'Clase de cocina en pareja', 'Picnic en el parque', 'Maratón de películas con snacks', 'Noche de karaoke', 'Visita a un mercado nocturno'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('datenight')
        .setDescription('Sugiere una idea para una cita'),

    name: 'datenight',
    aliases: ['ideacita'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx) {
        const idea = IDEAS[Math.floor(Math.random() * IDEAS.length)];
        return reply(ctx, infoPanel('💑 Idea de cita', idea));
    },
};
