// src/hybrid/smug/smug.js
const { SlashCommandBuilder } = require('discord.js');
const { executeSocialAction } = require('../../lib/socialExecutor');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('smug')
        .setDescription('Pon cara de suficiencia'),

    name: 'smug',
    aliases: [],
    category: 'diversión',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        return executeSocialAction('smug', ctx, args);
    },
};
