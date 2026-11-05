// /catmeme — gato con texto encima (cataas).
// Texto corto funciona mejor: cataas no ajusta la fuente a textos largos y
// el resultado queda cortado.

const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { catWithText, randomCat } = require('../../lib/api/memeApi');
const ui = require('../../lib/ui');

const PRESETS = [
    'me programo en 5 minutos',
    'soy bot, no humano',
    '¿viste el error?',
    'deploy en producción un viernes',
    'yo también',
    'Güba, elh neñe',
    'cuando el bot se cae',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('catmeme')
        .setDescription('Muestra un gato con un texto encima')
        .addStringOption(o => o
            .setName('texto')
            .setDescription('Frase corta (sin esto: una al azar)')
            .setMaxLength(60)
            .setRequired(false))
        .addStringOption(o => o
            .setName('color')
            .setDescription('Color del texto (por defecto, el que pone el gato)')
            .setRequired(false)),

    name: 'catmeme',
    aliases: ['gatomeme', 'cattexto', 'catas'],
    category: 'diversión',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        const slash = isSlash(ctx);
        const raw = slash ? ctx.options.getString('texto') : args.join(' ');
        const color = slash ? ctx.options.getString('color') : args[args.length - 1]?.match(/^#[0-9a-f]{6}$/i) ? args.pop() : null;

        // Sin texto: frase al azar de las que funcionan con el tamaño de fuente.
        const text = (raw || PRESETS[Math.floor(Math.random() * PRESETS.length)]).slice(0, 60);
        const url = color ? catWithText(text, { color }) : (raw ? catWithText(text) : randomCat());

        return reply(ctx, ui.imagePayload({
            category: 'diversión',
            icon: '🐱',
            kicker: 'Gato con texto',
            title: raw ? 'Tu meme felino' : 'Gato random',
            caption: raw ? null : `Frase: *${text}*`,
            media: { url, description: text },
            source: 'cataas.com',
            sourceUrl: 'https://cataas.com/',
        }));
    },
};
