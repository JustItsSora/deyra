const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

function vigenere(text, key, decode) {
    const cleanKey = key.toLowerCase().replace(/[^a-z]/g, '');
    if (!cleanKey) return text;

    let keyIndex = 0;
    return text.replace(/[a-zA-Z]/g, c => {
        const base = c <= 'Z' ? 65 : 97;
        const keyShift = cleanKey.charCodeAt(keyIndex % cleanKey.length) - 97;
        keyIndex++;
        const shift = decode ? -keyShift : keyShift;
        return String.fromCharCode(((c.charCodeAt(0) - base + shift + 26) % 26) + base);
    });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vigenere')
        .setDescription('Cifra o descifra texto con el cifrado Vigenère')
        .addStringOption(o => o.setName('modo').setDescription('encode o decode').setRequired(true).addChoices({ name: 'Cifrar', value: 'encode' }, { name: 'Descifrar', value: 'decode' }))
        .addStringOption(o => o.setName('clave').setDescription('Palabra clave').setRequired(true))
        .addStringOption(o => o.setName('texto').setDescription('Texto a procesar').setRequired(true)),

    name: 'vigenere',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        let mode, key, text;
        if (isSlash(ctx)) {
            mode = ctx.options.getString('modo');
            key = ctx.options.getString('clave');
            text = ctx.options.getString('texto');
        } else {
            mode = args[0]?.toLowerCase();
            key = args[1];
            text = args.slice(2).join(' ');
        }

        if (!['encode', 'decode'].includes(mode) || !key || !text) {
            return reply(ctx, { ...errorPanel('Uso incorrecto', 'Uso: `/vigenere modo:<encode|decode> clave:<palabra> texto:<texto>`'), ephemeral: true });
        }

        const result = vigenere(text, key, mode === 'decode');
        return reply(ctx, infoPanel('Cifrado Vigenère', `\`\`\`${result}\`\`\``));
    },
};
