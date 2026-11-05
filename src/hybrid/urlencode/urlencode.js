const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('urlencode')
        .setDescription('Codifica texto para uso en URLs')
        .addStringOption(o => o.setName('texto').setDescription('Texto a codificar').setRequired(true)),

    name: 'urlencode',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const text = isSlash(ctx) ? ctx.options.getString('texto') : args.join(' ');
        if (!text) {
            return reply(ctx, { ...errorPanel('Falta el texto', 'Especifica el texto a codificar.'), ephemeral: true });
        }

        return reply(ctx, infoPanel('URL Encode', `\`\`\`${encodeURIComponent(text)}\`\`\``));
    },
};
