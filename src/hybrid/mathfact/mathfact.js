const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

async function fetchMathFact(number) {
    const res = await fetch(`http://numbersapi.com/${number}/math`);
    if (!res.ok) throw new Error(`numbersapi ${res.status}`);
    return res.text();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mathfact')
        .setDescription('Muestra un dato matemático sobre un número')
        .addIntegerOption(o => o.setName('numero').setDescription('El número').setRequired(true)),

    name: 'mathfact',
    aliases: ['datomate'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const n = isSlash(ctx) ? ctx.options.getInteger('numero') : parseInt(args[0], 10);
        if (Number.isNaN(n)) {
            return reply(ctx, { ...errorPanel('Valor inválido', 'Especifica un número entero.'), ephemeral: true });
        }

        try {
            const fact = await fetchMathFact(n);
            return reply(ctx, infoPanel(`➗ Dato matemático sobre ${n}`, fact));
        } catch (err) {
            console.error('[mathfact] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude obtener un dato matemático sobre ese número.'), ephemeral: true });
        }
    },
};
