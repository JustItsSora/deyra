const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ascii')
        .setDescription('Convierte texto corto en arte ASCII simple')
        .addStringOption(o => o.setName('texto').setDescription('Texto (máx 10 caracteres)').setRequired(true)),

    name: 'ascii',
    aliases: [],
    category: 'diversión',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        const text = isSlash(ctx) ? ctx.options.getString('texto') : args.join(' ');
        if (!text) {
            return reply(ctx, { ...errorPanel('Falta el texto', 'Especifica el texto a convertir.'), ephemeral: true });
        }
        if (text.length > 10) {
            return reply(ctx, { ...errorPanel('Muy largo', 'Máximo 10 caracteres para el arte ASCII.'), ephemeral: true });
        }

        // Arte ASCII simple usando caracteres de bloque, sin dependencias externas.
        const bordered = `\`\`\`\n╔${'═'.repeat(text.length + 2)}╗\n║ ${text.toUpperCase()} ║\n╚${'═'.repeat(text.length + 2)}╝\n\`\`\``;
        return reply(ctx, { content: bordered });
    },
};
