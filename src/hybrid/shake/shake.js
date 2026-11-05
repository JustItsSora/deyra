// Generado por scripts/generateSocialCommands.js — no editar a mano.
// La definición real está en src/lib/socialActions.js (clave "shake").
const { SlashCommandBuilder } = require('discord.js');
const { executeSocialAction } = require('../../lib/socialExecutor');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shake')
        .setDescription('Sacude a alguien')
        .addUserOption(o => o
            .setName('usuario')
            .setDescription('A quién le hacés esto')
            .setRequired(true)),

    name: 'shake',
    aliases: [],
    category: 'diversión',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        return executeSocialAction('shake', ctx, args);
    },
};
