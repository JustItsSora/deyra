const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

function caesarShift(text, shift) {
    return text.replace(/[a-zA-Z]/g, c => {
        const base = c <= 'Z' ? 65 : 97;
        return String.fromCharCode(((c.charCodeAt(0) - base + shift + 26) % 26) + base);
    });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('caesar')
        .setDescription('Cifra o descifra texto con el cifrado César')
        .addStringOption(o => o.setName('modo').setDescription('encode o decode').setRequired(true).addChoices({ name: 'Cifrar', value: 'encode' }, { name: 'Descifrar', value: 'decode' }))
        .addIntegerOption(o => o.setName('desplazamiento').setDescription('Desplazamiento (1-25)').setMinValue(1).setMaxValue(25).setRequired(true))
        .addStringOption(o => o.setName('texto').setDescription('Texto a procesar').setRequired(true)),

    name: 'caesar',
    aliases: ['cesar'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        let mode, shift, text;
        if (isSlash(ctx)) {
            mode = ctx.options.getString('modo');
            shift = ctx.options.getInteger('desplazamiento');
            text = ctx.options.getString('texto');
        } else {
            mode = args[0]?.toLowerCase();
            shift = parseInt(args[1], 10);
            text = args.slice(2).join(' ');
        }

        if (!['encode', 'decode'].includes(mode) || !shift || !text) {
            return reply(ctx, { ...errorPanel('Uso incorrecto', 'Uso: `/caesar modo:<encode|decode> desplazamiento:<1-25> texto:<texto>`'), ephemeral: true });
        }

        const effectiveShift = mode === 'encode' ? shift : -shift;
        const result = caesarShift(text, effectiveShift);

        return reply(ctx, infoPanel('Cifrado César', `\`\`\`${result}\`\`\``));
    },
};
