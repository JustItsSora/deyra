const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('yesno')
        .setDescription('Respuesta rápida de sí o no al azar'),

    name: 'yesno',
    aliases: ['sino'],
    category: 'diversión',
    cooldownMs: 1500,

    async execute(ctx) {
        const answer = Math.random() < 0.5 ? 'Sí ✅' : 'No ❌';
        return reply(ctx, infoPanel('🎲 Respuesta', `**${answer}**`));
    },
};
