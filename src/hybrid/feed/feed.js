// src/hybrid/feed/feed.js
const { SlashCommandBuilder } = require('discord.js');
const { executeSocialAction } = require('../../lib/socialExecutor');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('feed')
        .setDescription('Alimenta a alguien')
        .addUserOption(o => o.setName('usuario').setDescription('Usuario objetivo').setRequired(true)),

    name: 'feed',
    aliases: [],
    category: 'diversión',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        return executeSocialAction('feed', ctx, args);
    },
};
