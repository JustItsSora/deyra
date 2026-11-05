const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

const BLESSINGS = [
    'que tengas éxito en todo lo que emprendas',
    'que la buena suerte te acompañe siempre',
    'que tu camino esté lleno de alegría',
    'que todos tus sueños se cumplan',
    'que la prosperidad llegue a tu vida',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blessing')
        .setDescription('Da una bendición a alguien')
        .addUserOption(o => o.setName('usuario').setDescription('A quién bendecir').setRequired(false)),

    name: 'blessing',
    aliases: ['bendicion'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const authorId = getUserId(ctx);
        const targetId = isSlash(ctx) ? (ctx.options.getUser('usuario')?.id || authorId) : (args[0]?.replace(/[<@!>]/g, '') || authorId);

        const blessing = BLESSINGS[Math.floor(Math.random() * BLESSINGS.length)];
        return reply(ctx, infoPanel('✨ Bendición', `<@${authorId}> bendice a <@${targetId}>: ${blessing}.`));
    },
};
