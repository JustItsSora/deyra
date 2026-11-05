const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

const ROASTS = [
    'eres tan lento que ni el WiFi de tu casa te espera',
    'tienes la energía de un cargador de celular sin cable',
    'eres la razón por la que existen los manuales de instrucciones',
    'si la pereza fuera un deporte olímpico, tú serías el entrenador',
    'tu personalidad es tan plana como tu batería al 1%',
    'pareces la versión beta de una buena idea',
    'eres el equivalente humano a un buffer cargando al 99%',
    'tienes más ceros que un banco central',
    'eres tan predecible como un anuncio antes de un video',
    'tu sentido del humor necesita actualización de software',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roast')
        .setDescription('Lanza una broma pesada (amistosa) a alguien')
        .addUserOption(o => o.setName('usuario').setDescription('Usuario a "roastear"').setRequired(false)),

    name: 'roast',
    aliases: [],
    category: 'diversión',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        const authorId = getUserId(ctx);
        const targetId = isSlash(ctx) ? (ctx.options.getUser('usuario')?.id || authorId) : (args[0]?.replace(/[<@!>]/g, '') || authorId);

        const roast = ROASTS[Math.floor(Math.random() * ROASTS.length)];
        return reply(ctx, infoPanel('🔥 Roast', `<@${targetId}>, ${roast}.`));
    },
};
