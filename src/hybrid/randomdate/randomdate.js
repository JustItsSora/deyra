const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('randomdate')
        .setDescription('Genera una fecha aleatoria entre 1950 y 2050'),

    name: 'randomdate',
    aliases: ['fechaaleatoria'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx) {
        const start = new Date(1950, 0, 1).getTime();
        const end = new Date(2050, 11, 31).getTime();
        const randomDate = new Date(start + Math.random() * (end - start));

        return reply(ctx, infoPanel('📅 Fecha aleatoria', `**${randomDate.toLocaleDateString('es-ES')}**`));
    },
};
