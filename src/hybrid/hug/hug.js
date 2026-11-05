// src/hybrid/hug/hug.js
const { SlashCommandBuilder } = require('discord.js');
const { executeSocialAction } = require('../../lib/socialExecutor');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hug')
        .setDescription('Dale un abrazo a alguien')
        .addUserOption(o => o.setName('usuario').setDescription('Usuario objetivo').setRequired(true)),

    name: 'hug',
    aliases: [],
    category: 'diversión',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        return executeSocialAction('hug', ctx, args);
    },
};
