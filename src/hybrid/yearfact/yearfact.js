const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

async function fetchYearFact(year) {
    const res = await fetch(`http://numbersapi.com/${year}/year`);
    if (!res.ok) throw new Error(`numbersapi ${res.status}`);
    return res.text();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('yearfact')
        .setDescription('Muestra un dato histórico sobre un año')
        .addIntegerOption(o => o.setName('ano').setDescription('El año').setRequired(true)),

    name: 'yearfact',
    aliases: ['datoano'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const year = isSlash(ctx) ? ctx.options.getInteger('ano') : parseInt(args[0], 10);
        if (Number.isNaN(year)) {
            return reply(ctx, { ...errorPanel('Valor inválido', 'Especifica un año válido.'), ephemeral: true });
        }

        try {
            const fact = await fetchYearFact(year);
            return reply(ctx, infoPanel(`📅 Dato sobre el año ${year}`, fact));
        } catch (err) {
            console.error('[yearfact] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude obtener un dato sobre ese año.'), ephemeral: true });
        }
    },
};
