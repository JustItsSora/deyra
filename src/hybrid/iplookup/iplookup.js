const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

// ip-api.com — servicio gratuito de geolocalización de IP, sin key (límite razonable de uso).
async function fetchIpInfo(ip) {
    const res = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?lang=es`);
    if (!res.ok) throw new Error(`ip-api ${res.status}`);
    return res.json();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('iplookup')
        .setDescription('Consulta información geográfica de una dirección IP')
        .addStringOption(o => o.setName('ip').setDescription('Dirección IP a consultar').setRequired(true)),

    name: 'iplookup',
    aliases: ['ip'],
    category: 'utilidad',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        const ip = isSlash(ctx) ? ctx.options.getString('ip') : args[0];
        if (!ip) {
            return reply(ctx, { ...errorPanel('Falta la IP', 'Especifica una dirección IP.'), ephemeral: true });
        }

        let data;
        try {
            data = await fetchIpInfo(ip);
        } catch (err) {
            console.error('[iplookup] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude consultar esa dirección IP.'), ephemeral: true });
        }

        if (data.status === 'fail') {
            return reply(ctx, { ...errorPanel('No encontrado', 'No pude obtener información de esa IP.'), ephemeral: true });
        }

        const lines = [
            `**País:** ${data.country || 'Desconocido'}`,
            `**Región:** ${data.regionName || 'Desconocido'}`,
            `**Ciudad:** ${data.city || 'Desconocido'}`,
            `**ISP:** ${data.isp || 'Desconocido'}`,
            `**Zona horaria:** ${data.timezone || 'Desconocido'}`,
        ];

        return reply(ctx, infoPanel(`Información de ${ip}`, undefined, { lines }));
    },
};
