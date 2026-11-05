// src/hybrid/wave/wave.js
const { SlashCommandBuilder } = require('discord.js');
const { executeSocialAction } = require('../../lib/socialExecutor');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wave')
        .setDescription('Saluda a alguien')
        .addUserOption(o => o.setName('usuario').setDescription('Usuario objetivo').setRequired(true)),

    name: 'wave',
    aliases: [],
    category: 'diversión',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        return executeSocialAction('wave', ctx, args);
    },
};
