// Generado por scripts/generateSocialCommands.js — no editar a mano.
// La definición real está en src/lib/socialActions.js (clave "lurk").
const { SlashCommandBuilder } = require('discord.js');
const { executeSocialAction } = require('../../lib/socialExecutor');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lurk')
        .setDescription('Acechá'),

    name: 'lurk',
    aliases: [],
    category: 'diversión',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        return executeSocialAction('lurk', ctx, args);
    },
};
