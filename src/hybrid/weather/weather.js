const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

// wttr.in — servicio gratuito de clima, sin API key. https://wttr.in
async function fetchWeather(city) {
    const res = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
    if (!res.ok) throw new Error(`wttr.in ${res.status}`);
    return res.json();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('weather')
        .setDescription('Consulta el clima de una ciudad')
        .addStringOption(o => o.setName('ciudad').setDescription('Nombre de la ciudad').setRequired(true)),

    name: 'weather',
    aliases: ['clima'],
    category: 'utilidad',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        const city = isSlash(ctx) ? ctx.options.getString('ciudad') : args.join(' ');
        if (!city) {
            return reply(ctx, { ...errorPanel('Falta la ciudad', 'Especifica el nombre de una ciudad.'), ephemeral: true });
        }

        let data;
        try {
            data = await fetchWeather(city);
        } catch (err) {
            console.error('[weather] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude obtener el clima para esa ciudad. Verifica el nombre.'), ephemeral: true });
        }

        const current = data.current_condition?.[0];
        const areaName = data.nearest_area?.[0]?.areaName?.[0]?.value || city;
        if (!current) {
            return reply(ctx, { ...errorPanel('Sin datos', 'No encontré información de clima para esa ciudad.'), ephemeral: true });
        }

        const lines = [
            `**Condición:** ${current.lang_es?.[0]?.value || current.weatherDesc?.[0]?.value}`,
            `**Temperatura:** ${current.temp_C}°C (sensación ${current.FeelsLikeC}°C)`,
            `**Humedad:** ${current.humidity}%`,
            `**Viento:** ${current.windspeedKmph} km/h`,
            `**Visibilidad:** ${current.visibility} km`,
        ];

        return reply(ctx, infoPanel(`🌤️ Clima en ${areaName}`, undefined, { lines }));
    },
};
