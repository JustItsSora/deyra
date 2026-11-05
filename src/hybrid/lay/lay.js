// Generado por scripts/generateSocialCommands.js — no editar a mano.
// La definición real está en src/lib/socialActions.js (clave "lay").
const { SlashCommandBuilder } = require('discord.js');
const { executeSocialAction } = require('../../lib/socialExecutor');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lay')
        .setDescription('Túmbate encima de alguien')
        .addUserOption(o => o
            .setName('usuario')
            .setDescription('A quién le hacés esto')
            .setRequired(true)),

    name: 'lay',
    aliases: [],
    category: 'diversión',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        return executeSocialAction('lay', ctx, args);
    },
};
