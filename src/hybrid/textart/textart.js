const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('textart')
        .setDescription('Envuelve un texto en un marco decorativo')
        .addStringOption(o => o.setName('texto').setDescription('Texto (máx 30 caracteres)').setRequired(true)),

    name: 'textart',
    aliases: [],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const text = isSlash(ctx) ? ctx.options.getString('texto') : args.join(' ');
        if (!text) {
            return reply(ctx, { ...errorPanel('Falta el texto', 'Especifica el texto.'), ephemeral: true });
        }
        if (text.length > 30) {
            return reply(ctx, { ...errorPanel('Muy largo', 'Máximo 30 caracteres.'), ephemeral: true });
        }

        const width = text.length + 4;
        const top = `✦${'─'.repeat(width)}✦`;
        const middle = `│  ${text}  │`;

        return reply(ctx, { content: `\`\`\`\n${top}\n${middle}\n${top}\n\`\`\`` });
    },
};
