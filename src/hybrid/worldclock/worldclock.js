const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

const ZONES = [
    { label: 'Nueva York', tz: 'America/New_York' },
    { label: 'Los Ángeles', tz: 'America/Los_Angeles' },
    { label: 'Ciudad de México', tz: 'America/Mexico_City' },
    { label: 'Buenos Aires', tz: 'America/Argentina/Buenos_Aires' },
    { label: 'Madrid', tz: 'Europe/Madrid' },
    { label: 'Londres', tz: 'Europe/London' },
    { label: 'Tokio', tz: 'Asia/Tokyo' },
    { label: 'Sídney', tz: 'Australia/Sydney' },
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('worldclock')
        .setDescription('Muestra la hora actual en varias ciudades del mundo'),

    name: 'worldclock',
    aliases: ['horamundial'],
    category: 'utilidad',
    cooldownMs: 3000,

    async execute(ctx) {
        const now = new Date();
        const lines = ZONES.map(z => {
            const time = new Intl.DateTimeFormat('es-ES', { timeZone: z.tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(now);
            return `**${z.label}:** ${time}`;
        });

        return reply(ctx, infoPanel('🌍 Hora mundial', undefined, { lines }));
    },
};
