const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

function normalize(text) {
    return text.toLowerCase().replace(/[^a-záéíóúñ]/g, '').split('').sort().join('');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('anagram')
        .setDescription('Verifica si dos textos son anagramas entre sí')
        .addStringOption(o => o.setName('texto1').setDescription('Primer texto').setRequired(true))
        .addStringOption(o => o.setName('texto2').setDescription('Segundo texto').setRequired(true)),

    name: 'anagram',
    aliases: ['anagrama'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        let text1, text2;
        if (isSlash(ctx)) {
            text1 = ctx.options.getString('texto1');
            text2 = ctx.options.getString('texto2');
        } else {
            [text1, text2] = args.join(' ').split(',').map(s => s.trim());
        }

        if (!text1 || !text2) {
            return reply(ctx, { ...errorPanel('Faltan textos', 'Especifica dos textos a comparar.'), ephemeral: true });
        }

        const isAnagram = normalize(text1) === normalize(text2);
        return reply(ctx, infoPanel('Verificación de anagrama', `"${text1}" y "${text2}" ${isAnagram ? 'SÍ' : 'NO'} son anagramas.`));
    },
};
