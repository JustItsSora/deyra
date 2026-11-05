const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

const MESSAGES = [
    'Mereces todo lo bueno que te está pasando.',
    'Tu voz importa, y lo que dices tiene valor.',
    'Eres capaz de lograr cosas increíbles.',
    'No necesitas la aprobación de todos para valer.',
    'Tus ideas son valiosas, compártelas sin miedo.',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('confidence')
        .setDescription('Recibe un mensaje para subir tu confianza')
        .addUserOption(o => o.setName('usuario').setDescription('Para quién es el mensaje').setRequired(false)),

    name: 'confidence',
    aliases: ['confianza'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const targetId = isSlash(ctx) ? (ctx.options.getUser('usuario')?.id || getUserId(ctx)) : (args[0]?.replace(/[<@!>]/g, '') || getUserId(ctx));
        const message = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];

        return reply(ctx, infoPanel('✨ Confianza', `<@${targetId}>, ${message}`));
    },
};
