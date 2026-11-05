// src/hybrid/thumbsup/thumbsup.js
const { SlashCommandBuilder } = require('discord.js');
const { executeSocialAction } = require('../../lib/socialExecutor');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('thumbsup')
        .setDescription('Da un pulgar arriba'),

    name: 'thumbsup',
    aliases: [],
    category: 'diversión',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        return executeSocialAction('thumbsup', ctx, args);
    },
};
