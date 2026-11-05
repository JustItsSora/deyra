// src/hybrid/happy/happy.js
const { SlashCommandBuilder } = require('discord.js');
const { executeSocialAction } = require('../../lib/socialExecutor');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('happy')
        .setDescription('Muestra lo feliz que estás'),

    name: 'happy',
    aliases: [],
    category: 'diversión',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        return executeSocialAction('happy', ctx, args);
    },
};
