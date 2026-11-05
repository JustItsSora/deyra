const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

const GIFTS = ['Un libro de su autor favorito', 'Auriculares inalámbricos', 'Una planta de interior', 'Una experiencia (concierto, taller, clase)', 'Una taza personalizada', 'Un set de velas aromáticas', 'Una suscripción a streaming', 'Un juego de mesa'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giftidea')
        .setDescription('Sugiere una idea de regalo aleatoria'),

    name: 'giftidea',
    aliases: ['idearegalo'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx) {
        const gift = GIFTS[Math.floor(Math.random() * GIFTS.length)];
        return reply(ctx, infoPanel('🎁 Idea de regalo', gift));
    },
};
