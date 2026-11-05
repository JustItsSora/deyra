const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('randomtime')
        .setDescription('Genera una hora aleatoria del día'),

    name: 'randomtime',
    aliases: ['horaaleatoria'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx) {
        const hours = String(Math.floor(Math.random() * 24)).padStart(2, '0');
        const minutes = String(Math.floor(Math.random() * 60)).padStart(2, '0');

        return reply(ctx, infoPanel('🕐 Hora aleatoria', `**${hours}:${minutes}**`));
    },
};
