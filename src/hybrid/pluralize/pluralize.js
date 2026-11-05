const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

function pluralize(word) {
    const lower = word.toLowerCase();
    if (/[aeiou]$/.test(lower)) return `${word}s`;
    if (/[áéíóú]$/.test(lower)) return `${word}es`;
    if (/z$/.test(lower)) return `${word.slice(0, -1)}ces`;
    return `${word}es`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pluralize')
        .setDescription('Convierte una palabra en español a su forma plural (regla básica)')
        .addStringOption(o => o.setName('palabra').setDescription('Palabra en singular').setRequired(true)),

    name: 'pluralize',
    aliases: ['pluralizar'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const word = isSlash(ctx) ? ctx.options.getString('palabra') : args[0];
        if (!word) {
            return reply(ctx, { ...errorPanel('Falta la palabra', 'Especifica una palabra en singular.'), ephemeral: true });
        }

        return reply(ctx, infoPanel('Plural generado', `**${word}** → **${pluralize(word)}**\n\n-# Regla básica del español; puede no aplicar a irregulares.`));
    },
};
