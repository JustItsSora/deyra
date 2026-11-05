const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

const OUTFITS = ['Jeans + camisa blanca + tenis blancos', 'Vestido floral + sandalias', 'Traje casual gris + mocasines', 'Sudadera oversized + joggers', 'Falda midi + suéter de cuello alto', 'Overol + camiseta básica'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('outfitidea')
        .setDescription('Sugiere una idea de outfit aleatoria'),

    name: 'outfitidea',
    aliases: ['idearoutfit'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx) {
        const outfit = OUTFITS[Math.floor(Math.random() * OUTFITS.length)];
        return reply(ctx, infoPanel('👗 Idea de outfit', outfit));
    },
};
