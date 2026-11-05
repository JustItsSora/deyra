const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

// SpaceX API — pública, gratuita, sin key. https://github.com/r-spacex/SpaceX-API
async function fetchNextLaunch() {
    const res = await fetch('https://api.spacexdata.com/v4/launches/next');
    if (!res.ok) throw new Error(`spacex ${res.status}`);
    return res.json();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spacex')
        .setDescription('Muestra información del próximo lanzamiento de SpaceX'),

    name: 'spacex',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 3000,

    async execute(ctx) {
        let data;
        try {
            data = await fetchNextLaunch();
        } catch (err) {
            console.error('[spacex] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude obtener información de SpaceX.'), ephemeral: true });
        }

        const dateUnix = data.date_unix;
        const lines = [
            `**Misión:** ${data.name}`,
            `**Fecha:** <t:${dateUnix}:F> (<t:${dateUnix}:R>)`,
            `**Detalles:** ${data.details || 'Sin detalles disponibles'}`,
        ];

        return reply(ctx, infoPanel('🚀 Próximo lanzamiento de SpaceX', undefined, { lines }));
    },
};
