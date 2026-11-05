// Generado por scripts/generateSocialCommands.js — no editar a mano.
// La definición real está en src/lib/socialActions.js (clave "lappillow").
const { SlashCommandBuilder } = require('discord.js');
const { executeSocialAction } = require('../../lib/socialExecutor');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lappillow')
        .setDescription('Usa a alguien de almohada')
        .addUserOption(o => o
            .setName('usuario')
            .setDescription('A quién le hacés esto')
            .setRequired(true)),

    name: 'lappillow',
    aliases: [],
    category: 'diversión',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        return executeSocialAction('lappillow', ctx, args);
    },
};
