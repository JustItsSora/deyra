const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

const BOOKS = ['Cien años de soledad', '1984', 'El principito', 'Rayuela', 'Sapiens', 'El nombre del viento', 'Fahrenheit 451', 'Crimen y castigo', 'La sombra del viento', 'Norwegian Wood'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('booksuggestion')
        .setDescription('Sugiere un libro aleatorio para leer'),

    name: 'booksuggestion',
    aliases: ['libro'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx) {
        const book = BOOKS[Math.floor(Math.random() * BOOKS.length)];
        return reply(ctx, infoPanel('📚 Sugerencia de libro', `Podrías leer: **${book}**`));
    },
};
