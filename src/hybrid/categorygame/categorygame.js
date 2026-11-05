const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

const CATEGORIES = ['Animales', 'Países', 'Comida', 'Películas', 'Deportes', 'Colores', 'Profesiones', 'Ciudades', 'Frutas', 'Marcas de ropa'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('categorygame')
        .setDescription('Genera una categoría aleatoria para el juego "Basta" / "Stop"'),

    name: 'categorygame',
    aliases: ['basta', 'stop'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx) {
        const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        const categories = [...CATEGORIES].sort(() => Math.random() - 0.5).slice(0, 5);

        return reply(ctx, infoPanel(`🔤 Letra: ${letter}`, `Categorías: ${categories.join(', ')}`));
    },
};
