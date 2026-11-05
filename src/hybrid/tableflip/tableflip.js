// Generado por scripts/generateSocialCommands.js — no editar a mano.
// La definición real está en src/lib/socialActions.js (clave "tableflip").
const { SlashCommandBuilder } = require('discord.js');
const { executeSocialAction } = require('../../lib/socialExecutor');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tableflip')
        .setDescription('Tirá la mesa'),

    name: 'tableflip',
    aliases: [],
    category: 'diversión',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        return executeSocialAction('tableflip', ctx, args);
    },
};
