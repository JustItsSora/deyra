const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

const COUNTRIES = ['Japón', 'Brasil', 'Egipto', 'Noruega', 'Nueva Zelanda', 'Marruecos', 'Tailandia', 'Portugal', 'Kenia', 'Vietnam', 'Perú', 'Grecia'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('randomcountry')
        .setDescription('Muestra un país aleatorio del mundo'),

    name: 'randomcountry',
    aliases: ['paisaleatorio'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx) {
        const country = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
        return reply(ctx, infoPanel('🌍 País aleatorio', `**${country}**`));
    },
};
