const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

const CHARACTERS = ['un caballero medieval', 'una IA con sentimientos', 'un pirata jubilado', 'una bruja urbana', 'un astronauta perdido', 'un detective torpe'];
const SETTINGS = ['en una cafetería que no existe de día', 'en el año 3000', 'dentro de un videojuego', 'en un pueblo donde nunca llueve', 'en la última nave espacial de la Tierra'];
const TWISTS = ['descubre que puede hablar con los animales', 'encuentra una carta de sí mismo del futuro', 'pierde la memoria cada medianoche', 'se da cuenta de que es el único que puede ver fantasmas', 'debe elegir entre dos realidades paralelas'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fanfic')
        .setDescription('Genera una premisa aleatoria de historia para inspirarte'),

    name: 'fanfic',
    aliases: [],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx) {
        const character = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
        const setting = SETTINGS[Math.floor(Math.random() * SETTINGS.length)];
        const twist = TWISTS[Math.floor(Math.random() * TWISTS.length)];

        return reply(ctx, infoPanel('📖 Premisa de historia', `${character.charAt(0).toUpperCase() + character.slice(1)}, ${setting}, ${twist}.`));
    },
};
