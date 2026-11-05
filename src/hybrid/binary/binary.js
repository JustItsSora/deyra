const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('binary')
        .setDescription('Convierte texto a binario o binario a texto')
        .addStringOption(o => o.setName('modo').setDescription('encode o decode').setRequired(true).addChoices({ name: 'Texto a binario', value: 'encode' }, { name: 'Binario a texto', value: 'decode' }))
        .addStringOption(o => o.setName('texto').setDescription('Texto o binario a convertir').setRequired(true)),

    name: 'binary',
    aliases: ['binario'],
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
            return reply(ctx, { ...errorPanel('Uso incorrecto', 'Uso: `/binary modo:<encode|decode> texto:<texto>`'), ephemeral: true });
        }

        try {
            if (mode === 'encode') {
                const result = [...text].map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
                return reply(ctx, infoPanel('Texto a Binario', `\`\`\`${result}\`\`\``));
            }
            const result = text.trim().split(/\s+/).map(bin => String.fromCharCode(parseInt(bin, 2))).join('');
            return reply(ctx, infoPanel('Binario a Texto', `\`\`\`${result}\`\`\``));
        } catch {
            return reply(ctx, { ...errorPanel('Error', 'No pude procesar ese texto/binario.'), ephemeral: true });
        }
    },
};
