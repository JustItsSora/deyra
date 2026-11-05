const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

function rot13(text) {
    return text.replace(/[a-zA-Z]/g, c => {
        const base = c <= 'Z' ? 65 : 97;
        return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
    });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rot13')
        .setDescription('Codifica/decodifica texto con el cifrado ROT13')
        .addStringOption(o => o.setName('texto').setDescription('Texto a procesar').setRequired(true)),

    name: 'rot13',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const text = isSlash(ctx) ? ctx.options.getString('texto') : args.join(' ');
        if (!text) {
            return reply(ctx, { ...errorPanel('Falta el texto', 'Especifica el texto a procesar.'), ephemeral: true });
        }

        return reply(ctx, infoPanel('ROT13', `\`\`\`${rot13(text)}\`\`\``));
    },
};
