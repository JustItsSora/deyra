// src/hybrid/pout/pout.js
const { SlashCommandBuilder } = require('discord.js');
const { executeSocialAction } = require('../../lib/socialExecutor');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pout')
        .setDescription('Haz un puchero'),

    name: 'pout',
    aliases: [],
    category: 'diversión',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        return executeSocialAction('pout', ctx, args);
    },
};
