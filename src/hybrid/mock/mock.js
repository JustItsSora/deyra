const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mock')
        .setDescription('cOnViErTe uN tExTo eN eL EstIlO mOfA (SpOnGeBoB)')
        .addStringOption(o => o.setName('texto').setDescription('Texto a convertir').setRequired(true)),

    name: 'mock',
    aliases: ['mofa'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const text = isSlash(ctx) ? ctx.options.getString('texto') : args.join(' ');
        if (!text) {
            return reply(ctx, { ...errorPanel('Falta el texto', 'Especifica qué texto quieres convertir.'), ephemeral: true });
        }

        const mocked = [...text].map((char, i) => (i % 2 === 0 ? char.toLowerCase() : char.toUpperCase())).join('');
        return reply(ctx, infoPanel('🐡 Texto mofa', mocked));
    },
};
