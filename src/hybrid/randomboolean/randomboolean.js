const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('randomboolean')
        .setDescription('Genera true o false al azar'),

    name: 'randomboolean',
    aliases: ['truefalserandom'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx) {
        const result = Math.random() < 0.5;
        return reply(ctx, infoPanel('Booleano aleatorio', `**${result}**`));
    },
};
