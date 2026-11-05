const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hex')
        .setDescription('Convierte texto a hexadecimal o viceversa')
        .addStringOption(o => o.setName('modo').setDescription('encode o decode').setRequired(true).addChoices({ name: 'Texto a hex', value: 'encode' }, { name: 'Hex a texto', value: 'decode' }))
        .addStringOption(o => o.setName('texto').setDescription('Texto o hex a convertir').setRequired(true)),

    name: 'hex',
    aliases: [],
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
            return reply(ctx, { ...errorPanel('Uso incorrecto', 'Uso: `/hex modo:<encode|decode> texto:<texto>`'), ephemeral: true });
        }

        try {
            if (mode === 'encode') {
                const result = Buffer.from(text, 'utf8').toString('hex');
                return reply(ctx, infoPanel('Texto a Hex', `\`\`\`${result}\`\`\``));
            }
            const result = Buffer.from(text.replace(/\s+/g, ''), 'hex').toString('utf8');
            return reply(ctx, infoPanel('Hex a Texto', `\`\`\`${result}\`\`\``));
        } catch {
            return reply(ctx, { ...errorPanel('Error', 'No pude procesar ese texto/hex.'), ephemeral: true });
        }
    },
};
