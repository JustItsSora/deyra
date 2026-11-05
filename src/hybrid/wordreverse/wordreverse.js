const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wordreverse')
        .setDescription('Invierte el orden de las palabras de una frase')
        .addStringOption(o => o.setName('texto').setDescription('Texto a procesar').setRequired(true)),

    name: 'wordreverse',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const text = isSlash(ctx) ? ctx.options.getString('texto') : args.join(' ');
        if (!text) {
            return reply(ctx, { ...errorPanel('Falta el texto', 'Especifica el texto a procesar.'), ephemeral: true });
        }

        const reversed = text.trim().split(/\s+/).reverse().join(' ');
        return reply(ctx, infoPanel('Orden de palabras invertido', reversed));
    },
};
