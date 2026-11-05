const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('urldecode')
        .setDescription('Decodifica texto de una URL')
        .addStringOption(o => o.setName('texto').setDescription('Texto a decodificar').setRequired(true)),

    name: 'urldecode',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const text = isSlash(ctx) ? ctx.options.getString('texto') : args.join(' ');
        if (!text) {
            return reply(ctx, { ...errorPanel('Falta el texto', 'Especifica el texto a decodificar.'), ephemeral: true });
        }

        try {
            return reply(ctx, infoPanel('URL Decode', `\`\`\`${decodeURIComponent(text)}\`\`\``));
        } catch {
            return reply(ctx, { ...errorPanel('Error', 'Ese texto no es una codificación URL válida.'), ephemeral: true });
        }
    },
};
