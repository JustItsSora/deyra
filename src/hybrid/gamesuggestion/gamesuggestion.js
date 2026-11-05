const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

const GAMES = ['Hollow Knight', 'Celeste', 'Stardew Valley', 'The Witcher 3', 'Hades', 'Minecraft', 'Among Us', 'Portal 2', 'Undertale', 'Terraria'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gamesuggestion')
        .setDescription('Sugiere un videojuego aleatorio para jugar'),

    name: 'gamesuggestion',
    aliases: ['videojuego'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx) {
        const game = GAMES[Math.floor(Math.random() * GAMES.length)];
        return reply(ctx, infoPanel('🎮 Sugerencia de videojuego', `Podrías jugar: **${game}**`));
    },
};
