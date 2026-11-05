// src/hybrid/pat/pat.js
const { SlashCommandBuilder } = require('discord.js');
const { executeSocialAction } = require('../../lib/socialExecutor');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pat')
        .setDescription('Acaricia la cabeza de alguien')
        .addUserOption(o => o.setName('usuario').setDescription('Usuario objetivo').setRequired(true)),

    name: 'pat',
    aliases: [],
    category: 'diversión',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        return executeSocialAction('pat', ctx, args);
    },
};
