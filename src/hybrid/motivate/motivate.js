const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

const MESSAGES = [
    'Cada paso que das, por pequeño que sea, te acerca a tu meta.',
    'Los errores no son fracasos, son parte del aprendizaje.',
    'Tienes más fuerza de la que crees.',
    'Hoy es una nueva oportunidad para intentarlo de nuevo.',
    'El progreso, no la perfección, es lo que importa.',
    'Confía en el proceso, los resultados llegarán.',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('motivate')
        .setDescription('Recibe un mensaje motivacional')
        .addUserOption(o => o.setName('usuario').setDescription('Para quién es el mensaje').setRequired(false)),

    name: 'motivate',
    aliases: ['motivar'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const targetId = isSlash(ctx) ? (ctx.options.getUser('usuario')?.id || getUserId(ctx)) : (args[0]?.replace(/[<@!>]/g, '') || getUserId(ctx));
        const message = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];

        return reply(ctx, infoPanel('💪 Motivación', `<@${targetId}>, ${message}`));
    },
};
