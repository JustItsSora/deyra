const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

const MORSE_MAP = {
    a: '.-', b: '-...', c: '-.-.', d: '-..', e: '.', f: '..-.', g: '--.', h: '....',
    i: '..', j: '.---', k: '-.-', l: '.-..', m: '--', n: '-.', o: '---', p: '.--.',
    q: '--.-', r: '.-.', s: '...', t: '-', u: '..-', v: '...-', w: '.--', x: '-..-',
    y: '-.--', z: '--..', '0': '-----', '1': '.----', '2': '..---', '3': '...--',
    '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
};
const REVERSE_MORSE = Object.fromEntries(Object.entries(MORSE_MAP).map(([k, v]) => [v, k]));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('morse')
        .setDescription('Convierte texto a código morse o viceversa')
        .addStringOption(o => o.setName('modo').setDescription('encode o decode').setRequired(true).addChoices({ name: 'Texto a morse', value: 'encode' }, { name: 'Morse a texto', value: 'decode' }))
        .addStringOption(o => o.setName('texto').setDescription('Texto o morse a convertir').setRequired(true)),

    name: 'morse',
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
            return reply(ctx, { ...errorPanel('Uso incorrecto', 'Uso: `/morse modo:<encode|decode> texto:<texto>`'), ephemeral: true });
        }

        if (mode === 'encode') {
            const result = [...text.toLowerCase()].map(c => (c === ' ' ? '/' : MORSE_MAP[c] || c)).join(' ');
            return reply(ctx, infoPanel('Texto a Morse', `\`\`\`${result}\`\`\``));
        }

        const result = text.trim().split(' ').map(code => (code === '/' ? ' ' : REVERSE_MORSE[code] || code)).join('');
        return reply(ctx, infoPanel('Morse a Texto', `\`\`\`${result}\`\`\``));
    },
};
