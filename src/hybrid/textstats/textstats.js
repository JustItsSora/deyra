const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('textstats')
        .setDescription('Muestra estadísticas completas de un texto (palabras, caracteres, oraciones)')
        .addStringOption(o => o.setName('texto').setDescription('Texto a analizar').setRequired(true)),

    name: 'textstats',
    aliases: ['estadisticastexto'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const text = isSlash(ctx) ? ctx.options.getString('texto') : args.join(' ');
        if (!text) {
            return reply(ctx, { ...errorPanel('Falta el texto', 'Especifica el texto a analizar.'), ephemeral: true });
        }

        const words = text.trim().split(/\s+/).filter(Boolean).length;
        const chars = text.length;
        const charsNoSpaces = text.replace(/\s/g, '').length;
        const sentences = (text.match(/[.!?]+/g) || []).length || 1;

        return reply(ctx, infoPanel('📊 Estadísticas del texto', undefined, {
            lines: [
                `**Palabras:** ${words}`,
                `**Caracteres (con espacios):** ${chars}`,
                `**Caracteres (sin espacios):** ${charsNoSpaces}`,
                `**Oraciones (aprox.):** ${sentences}`,
            ],
        }));
    },
};
