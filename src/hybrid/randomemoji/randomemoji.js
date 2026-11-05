const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

const EMOJIS = ['😀', '🎉', '🚀', '🔥', '💡', '🌟', '🎈', '🍕', '🐶', '🌈', '⚡', '🎮', '📚', '🎵', '☕', '🏆'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('randomemoji')
        .setDescription('Muestra un emoji unicode aleatorio'),

    name: 'randomemoji',
    aliases: ['emojialeatorio'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx) {
        const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
        return reply(ctx, infoPanel('Emoji aleatorio', emoji));
    },
};
