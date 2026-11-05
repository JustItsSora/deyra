const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('base64')
        .setDescription('Codifica o decodifica texto en Base64')
        .addStringOption(o => o.setName('modo').setDescription('encode o decode').setRequired(true).addChoices({ name: 'Codificar', value: 'encode' }, { name: 'Decodificar', value: 'decode' }))
        .addStringOption(o => o.setName('texto').setDescription('Texto a procesar').setRequired(true)),

    name: 'base64',
    aliases: ['b64'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        let mode, text;
        if (isSlash(ctx)) {
            mode = ctx.options.getString('modo');
            text = ctx.options.getString('texto');
        } else {
            mode = args[0]?.toLowerCase();
            text = args.slice(1).join(' ');
        }

        if (!['encode', 'decode'].includes(mode) || !text) {
            return reply(ctx, { ...errorPanel('Uso incorrecto', 'Uso: `/base64 modo:<encode|decode> texto:<texto>`'), ephemeral: true });
        }

        try {
            const result = mode === 'encode'
                ? Buffer.from(text, 'utf8').toString('base64')
                : Buffer.from(text, 'base64').toString('utf8');

            return reply(ctx, infoPanel(`Base64 — ${mode === 'encode' ? 'Codificado' : 'Decodificado'}`, `\`\`\`${result}\`\`\``));
        } catch {
            return reply(ctx, { ...errorPanel('Error', 'No pude procesar ese texto. Verifica que sea Base64 válido si estás decodificando.'), ephemeral: true });
        }
    },
};
