const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

const CAPITALS = ['París', 'Tokio', 'Berlín', 'Madrid', 'Roma', 'Ottawa', 'Canberra', 'Brasilia', 'Buenos Aires', 'El Cairo', 'Nairobi', 'Seúl'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('randomcapital')
        .setDescription('Muestra una capital aleatoria del mundo'),

    name: 'randomcapital',
    aliases: ['capitalaleatoria'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx) {
        const capital = CAPITALS[Math.floor(Math.random() * CAPITALS.length)];
        return reply(ctx, infoPanel('🏛️ Capital aleatoria', `**${capital}**`));
    },
};
