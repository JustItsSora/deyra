const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clap')
        .setDescription('Añade 👏 entre cada palabra de un texto')
        .addStringOption(o => o.setName('texto').setDescription('Texto a procesar').setRequired(true)),

    name: 'clap',
    aliases: ['aplauso'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const text = isSlash(ctx) ? ctx.options.getString('texto') : args.join(' ');
        if (!text) {
            return reply(ctx, { ...errorPanel('Falta el texto', 'Especifica el texto a procesar.'), ephemeral: true });
        }

        const result = text.trim().split(/\s+/).join(' 👏 ');
        return reply(ctx, infoPanel('👏 Clap Text', result));
    },
};
