const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

// API pública de Wikipedia en español, gratis, sin key.
async function fetchSummary(query) {
    const res = await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error(`wikipedia ${res.status}`);
    return res.json();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wikisearch')
        .setDescription('Busca un resumen de Wikipedia en español')
        .addStringOption(o => o.setName('tema').setDescription('Tema a buscar').setRequired(true)),

    name: 'wikisearch',
    aliases: ['wiki'],
    category: 'utilidad',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        const query = isSlash(ctx) ? ctx.options.getString('tema') : args.join(' ');
        if (!query) {
            return reply(ctx, { ...errorPanel('Falta el tema', 'Especifica un tema a buscar.'), ephemeral: true });
        }

        let data;
        try {
            data = await fetchSummary(query);
        } catch {
            return reply(ctx, { ...errorPanel('No encontrado', 'No encontré un artículo con ese nombre en Wikipedia.'), ephemeral: true });
        }

        const extract = (data.extract || 'Sin resumen disponible.').slice(0, 500);
        return reply(ctx, infoPanel(`📚 ${data.title}`, `${extract}${data.content_urls ? `\n\n[Leer más](${data.content_urls.desktop.page})` : ''}`));
    },
};
