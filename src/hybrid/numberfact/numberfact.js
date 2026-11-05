const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

// numbersapi.com — dato curioso sobre un número, gratis, sin key.
async function fetchFact(number) {
    const res = await fetch(`http://numbersapi.com/${number}/trivia`);
    if (!res.ok) throw new Error(`numbersapi ${res.status}`);
    return res.text();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('numberfact')
        .setDescription('Muestra un dato curioso sobre un número')
        .addIntegerOption(o => o.setName('numero').setDescription('El número').setRequired(true)),

    name: 'numberfact',
    aliases: ['datonumero'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const n = isSlash(ctx) ? ctx.options.getInteger('numero') : parseInt(args[0], 10);
        if (Number.isNaN(n)) {
            return reply(ctx, { ...errorPanel('Valor inválido', 'Especifica un número entero.'), ephemeral: true });
        }

        try {
            const fact = await fetchFact(n);
            return reply(ctx, infoPanel(`🔢 Dato sobre el ${n}`, fact));
        } catch (err) {
            console.error('[numberfact] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude obtener un dato sobre ese número.'), ephemeral: true });
        }
    },
};
