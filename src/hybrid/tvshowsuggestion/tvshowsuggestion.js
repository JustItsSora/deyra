const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

const SHOWS = ['Breaking Bad', 'The Office', 'Stranger Things', 'Dark', 'Attack on Titan', 'The Mandalorian', 'Peaky Blinders', 'Friends', 'The Crown', 'Death Note'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tvshowsuggestion')
        .setDescription('Sugiere una serie aleatoria para ver'),

    name: 'tvshowsuggestion',
    aliases: ['serie'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx) {
        const show = SHOWS[Math.floor(Math.random() * SHOWS.length)];
        return reply(ctx, infoPanel('📺 Sugerencia de serie', `Podrías ver: **${show}**`));
    },
};
