const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

const PHASES = [
    { name: 'Luna nueva', emoji: '🌑' }, { name: 'Luna creciente', emoji: '🌒' },
    { name: 'Cuarto creciente', emoji: '🌓' }, { name: 'Gibosa creciente', emoji: '🌔' },
    { name: 'Luna llena', emoji: '🌕' }, { name: 'Gibosa menguante', emoji: '🌖' },
    { name: 'Cuarto menguante', emoji: '🌗' }, { name: 'Luna menguante', emoji: '🌘' },
];
const SYNODIC_MONTH = 29.53058867; // días
const KNOWN_NEW_MOON = new Date('2000-01-06T18:14:00Z').getTime(); // referencia conocida

module.exports = {
    data: new SlashCommandBuilder()
        .setName('moonphase')
        .setDescription('Muestra la fase lunar actual (aproximada)'),

    name: 'moonphase',
    aliases: ['fasedeluna'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx) {
        const daysSince = (Date.now() - KNOWN_NEW_MOON) / 86400000;
        const phaseFraction = (daysSince % SYNODIC_MONTH) / SYNODIC_MONTH;
        const phaseIndex = Math.floor(phaseFraction * 8) % 8;
        const phase = PHASES[phaseIndex];

        return reply(ctx, infoPanel('🌙 Fase lunar actual', `${phase.emoji} **${phase.name}**`));
    },
};
