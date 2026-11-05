// /iss — dónde está la Estación Espacial Internacional ahora mismo.
// Los datos se cachean 5 s: la nave se mueve rápido, pero no tan rápido como
// para que hacer un request por persona y segundo tenga sentido.

const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { issPosition } = require('../../lib/api/lookupApi');
const ui = require('../../lib/ui');

// Calcula en qué hemisferio está la nave, para darle sentido a los dos
// números crudos que devuelve la API.
function hemisphere(lat, lon) {
    const ns = lat >= 0 ? 'Norte' : 'Sur';
    const ew = lon >= 0 ? 'Este' : 'Oeste';
    return `${ns} / ${ew}`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('iss')
        .setDescription('Muestra la ubicación actual de la Estación Espacial Internacional'),

    name: 'iss',
    aliases: ['estacion', 'issnow', 'espacial'],
    category: 'utilidad',
    cooldownMs: 5000,

    async execute(ctx) {
        let iss;
        try {
            iss = await issPosition();
        } catch (err) {
            console.error('[iss] Error:', err.message);
            return reply(ctx, ui.error('No pude obtener la posición', 'El servicio de la ISS no respondió.', { ephemeral: true }));
        }

        return reply(ctx, ui.payload({
            category: 'utilidad',
            icon: '🛰️',
            kicker: 'Estación Espacial Internacional',
            title: 'ISS — ubicación actual',
            description: `La estación está pasando sobre **${hemisphere(iss.latitude, iss.longitude)}**, a unos 400 km de altura.`,
            grid: [
                ['Latitud', `${iss.latitude.toFixed(4)}°`],
                ['Longitud', `${iss.longitude.toFixed(4)}°`],
                ['Hemisferio', hemisphere(iss.latitude, iss.longitude)],
                ['Datos de', `<t:${Math.floor(iss.timestamp / 1000)}:R>`],
            ],
            callouts: [{
                tone: 'muted',
                text: 'Viaja a ~28.000 km/h: la posición en pantalla se queda vieja enseguida.',
            }],
            footerText: 'Fuente: open-notify.org',
        }));
    },
};
