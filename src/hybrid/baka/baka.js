// src/hybrid/baka/baka.js
const { SlashCommandBuilder } = require('discord.js');
const { executeSocialAction } = require('../../lib/socialExecutor');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('baka')
        .setDescription('Grita baka con todas tus fuerzas'),

    name: 'baka',
    aliases: [],
    category: 'diversión',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        return executeSocialAction('baka', ctx, args);
    },
};
