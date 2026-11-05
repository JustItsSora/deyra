const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('textindent')
        .setDescription('Envuelve un texto en un bloque de código con sangría')
        .addStringOption(o => o.setName('texto').setDescription('Texto a indentar').setRequired(true)),

    name: 'textindent',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const text = isSlash(ctx) ? ctx.options.getString('texto') : args.join(' ');
        if (!text) {
            return reply(ctx, { ...errorPanel('Falta el texto', 'Especifica el texto a indentar.'), ephemeral: true });
        }

        const indented = text.split('\n').map(line => `    ${line}`).join('\n');
        return reply(ctx, { content: `\`\`\`\n${indented}\n\`\`\`` });
    },
};
