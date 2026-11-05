const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

const COMPLIMENTS = [
    'tienes una energía que ilumina cualquier servidor',
    'tu forma de pensar es realmente admirable',
    'eres de esas personas que hacen que todo sea más fácil',
    'tienes un talento natural para hacer sentir bien a los demás',
    'tu creatividad no tiene límites',
    'eres más fuerte de lo que crees',
    'tu sentido del humor alegra el día de cualquiera',
    'tienes una paciencia envidiable',
    'inspiras a quienes te rodean sin darte cuenta',
    'eres exactamente la persona que este servidor necesitaba',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('compliment')
        .setDescription('Dale un cumplido a alguien')
        .addUserOption(o => o.setName('usuario').setDescription('Usuario a halagar').setRequired(false)),

    name: 'compliment',
    aliases: ['halago'],
    category: 'diversión',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        const authorId = getUserId(ctx);
        const targetId = isSlash(ctx) ? (ctx.options.getUser('usuario')?.id || authorId) : (args[0]?.replace(/[<@!>]/g, '') || authorId);

        const compliment = COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)];
        return reply(ctx, infoPanel('💖 Cumplido', `<@${targetId}>, ${compliment}.`));
    },
};
