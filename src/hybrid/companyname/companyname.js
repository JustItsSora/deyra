const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

const PREFIXES = ['Nova', 'Prime', 'Apex', 'Lumen', 'Vertex', 'Nimbus', 'Orbit', 'Quantum'];
const SUFFIXES = ['Labs', 'Tech', 'Works', 'Studio', 'Group', 'Solutions', 'Dynamics', 'Co.'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('companyname')
        .setDescription('Genera un nombre de empresa aleatorio'),

    name: 'companyname',
    aliases: ['nombreempresa'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx) {
        const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
        const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];

        return reply(ctx, infoPanel('🏢 Nombre de empresa', `**${prefix} ${suffix}**`));
    },
};
