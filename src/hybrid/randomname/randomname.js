const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

const FIRST_NAMES = ['Alex', 'Sam', 'Jordan', 'Casey', 'Morgan', 'Taylor', 'Riley', 'Quinn', 'Avery', 'Rowan'];
const LAST_NAMES = ['García', 'Martínez', 'Rodríguez', 'López', 'Hernández', 'González', 'Pérez', 'Sánchez'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('randomname')
        .setDescription('Genera un nombre aleatorio'),

    name: 'randomname',
    aliases: ['nombrealeatorio'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx) {
        const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
        const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];

        return reply(ctx, infoPanel('👤 Nombre generado', `**${first} ${last}**`));
    },
};
