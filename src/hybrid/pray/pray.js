const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

const PRAYERS = [
    'que todo te salga bien hoy',
    'por tu salud y felicidad',
    'para que tengas un excelente día',
    'por buena suerte en lo que viene',
    'para que encuentres paz',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pray')
        .setDescription('Reza por alguien (o por ti mismo)')
        .addUserOption(o => o.setName('usuario').setDescription('Por quién rezar').setRequired(false)),

    name: 'pray',
    aliases: ['rezar'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const authorId = getUserId(ctx);
        const targetId = isSlash(ctx) ? (ctx.options.getUser('usuario')?.id || authorId) : (args[0]?.replace(/[<@!>]/g, '') || authorId);

        const prayer = PRAYERS[Math.floor(Math.random() * PRAYERS.length)];
        return reply(ctx, infoPanel('🙏 Oración', `<@${authorId}> reza por <@${targetId}>: ${prayer}.`));
    },
};
