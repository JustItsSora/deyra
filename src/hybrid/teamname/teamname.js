const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

const PREFIXES = ['Equipo', 'Escuadrón', 'Clan', 'Alianza', 'Legión'];
const NAMES = ['Fénix', 'Cobra', 'Titanes', 'Vanguardia', 'Centinela', 'Némesis', 'Vórtice', 'Eclipse'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('teamname')
        .setDescription('Genera un nombre de equipo o clan aleatorio'),

    name: 'teamname',
    aliases: ['nombreequipo'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx) {
        const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
        const name = NAMES[Math.floor(Math.random() * NAMES.length)];

        return reply(ctx, infoPanel('🛡️ Nombre de equipo', `**${prefix} ${name}**`));
    },
};
