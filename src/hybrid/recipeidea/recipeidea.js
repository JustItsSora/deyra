const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

const RECIPES = ['Pasta al pesto', 'Tacos de pollo', 'Curry de verduras', 'Ensalada César', 'Sopa de tomate', 'Arroz frito', 'Pizza casera', 'Sándwich club', 'Sushi rolls', 'Guacamole'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('recipeidea')
        .setDescription('Sugiere una idea de receta para cocinar hoy'),

    name: 'recipeidea',
    aliases: ['idearreceta'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx) {
        const recipe = RECIPES[Math.floor(Math.random() * RECIPES.length)];
        return reply(ctx, infoPanel('🍳 Idea de receta', `Podrías cocinar: **${recipe}**`));
    },
};
