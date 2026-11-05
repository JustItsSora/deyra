// src/hybrid/yeet/yeet.js
const { SlashCommandBuilder } = require('discord.js');
const { executeSocialAction } = require('../../lib/socialExecutor');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('yeet')
        .setDescription('Lanza a alguien por los aires')
        .addUserOption(o => o.setName('usuario').setDescription('Usuario objetivo').setRequired(true)),

    name: 'yeet',
    aliases: [],
    category: 'diversión',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        return executeSocialAction('yeet', ctx, args);
    },
};
