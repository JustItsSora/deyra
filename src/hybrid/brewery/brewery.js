// /brewery — cervecería al azar (Open Brewery DB).

const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { randomBrewery } = require('../../lib/api/lookupApi');
const ui = require('../../lib/ui');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('brewery')
        .setDescription('Muestra una cervecería al azar')
        .addBooleanOption(o => o
            .setName('detalles')
            .setDescription('Mostrar dirección y contacto (por defecto: sí)')
            .setRequired(false)),

    name: 'brewery',
    aliases: ['cerveceria', 'cerveza', 'beer'],
    category: 'diversión',
    cooldownMs: 5000,

    async execute(ctx) {
        let brewery;
        try {
            brewery = await randomBrewery();
        } catch (err) {
            console.error('[brewery] Error:', err.message);
            return reply(ctx, ui.error('No pude obtener datos', 'La fuente de cervecerías no respondió.', { ephemeral: true }));
        }

        const location = [brewery.city, brewery.state, brewery.country].filter(Boolean).join(', ');

        return reply(ctx, ui.payload({
            category: 'diversión',
            icon: '🍺',
            kicker: 'Open Brewery DB',
            title: brewery.name,
            description: location || 'Ubicación desconocida.',
            grid: [
                ['Tipo', brewery.type || '—'],
                ['Ciudad', brewery.city || '—'],
                ['Estado', brewery.state || '—'],
                ['País', brewery.country || '—'],
            ],
            lists: [
                brewery.phone ? { title: 'Contacto', items: [brewery.phone] } : null,
                brewery.website ? { title: 'Sitio web', items: [`<${brewery.website}>`] } : null,
            ].filter(Boolean),
            footerText: 'Datos de Open Brewery DB',
        }));
    },
};
