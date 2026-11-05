const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

const ANSWERS = [
    'Sí, definitivamente.', 'Es cierto.', 'Sin duda alguna.', 'Sí, puedes confiar en ello.',
    'Como yo lo veo, sí.', 'Es probable.', 'Buenas perspectivas.', 'Las señales apuntan a que sí.',
    'Respuesta confusa, intenta de nuevo.', 'Pregunta de nuevo más tarde.', 'Mejor no te digo ahora.',
    'No puedo predecirlo en este momento.', 'Concéntrate y pregunta de nuevo.',
    'No cuentes con ello.', 'Mi respuesta es no.', 'Mis fuentes dicen que no.',
    'Las perspectivas no son buenas.', 'Muy dudoso.',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('8ball')
        .setDescription('Hazle una pregunta a la bola 8 mágica')
        .addStringOption(o => o.setName('pregunta').setDescription('Tu pregunta').setRequired(true)),

    name: '8ball',
    aliases: ['bola8'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const question = isSlash(ctx) ? ctx.options.getString('pregunta') : args.join(' ');
        if (!question) {
            return reply(ctx, { ...errorPanel('Falta la pregunta', 'Escribe una pregunta para la bola 8.'), ephemeral: true });
        }

        const answer = ANSWERS[Math.floor(Math.random() * ANSWERS.length)];
        return reply(ctx, infoPanel('🎱 Bola 8 Mágica', `**Pregunta:** ${question}\n**Respuesta:** ${answer}`));
    },
};
