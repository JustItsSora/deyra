const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

const DESTINATIONS = ['Kioto, Japón', 'Cartagena, Colombia', 'Praga, República Checa', 'Ciudad del Cabo, Sudáfrica', 'Reikiavik, Islandia', 'Oaxaca, México', 'Queenstown, Nueva Zelanda', 'Marrakech, Marruecos'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('travelidea')
        .setDescription('Sugiere un destino de viaje aleatorio'),

    name: 'travelidea',
    aliases: ['ideaviaje'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx) {
        const destination = DESTINATIONS[Math.floor(Math.random() * DESTINATIONS.length)];
        return reply(ctx, infoPanel('✈️ Idea de destino', `Podrías visitar: **${destination}**`));
    },
};
