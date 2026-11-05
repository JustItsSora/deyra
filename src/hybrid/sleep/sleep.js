// src/hybrid/sleep/sleep.js
const { SlashCommandBuilder } = require('discord.js');
const { executeSocialAction } = require('../../lib/socialExecutor');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sleep')
        .setDescription('Vete a dormir'),

    name: 'sleep',
    aliases: [],
    category: 'diversión',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        return executeSocialAction('sleep', ctx, args);
    },
};
