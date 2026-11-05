// src/hybrid/laugh/laugh.js
const { SlashCommandBuilder } = require('discord.js');
const { executeSocialAction } = require('../../lib/socialExecutor');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('laugh')
        .setDescription('Ríete a carcajadas'),

    name: 'laugh',
    aliases: [],
    category: 'diversión',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        return executeSocialAction('laugh', ctx, args);
    },
};
