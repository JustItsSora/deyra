const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fight')
        .setDescription('Simula una pelea aleatoria contra alguien')
        .addUserOption(o => o.setName('usuario').setDescription('Tu oponente').setRequired(true)),

    name: 'fight',
    aliases: ['pelear'],
    category: 'diversión',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        const authorId = getUserId(ctx);
        const targetId = isSlash(ctx) ? ctx.options.getUser('usuario')?.id : args[0]?.replace(/[<@!>]/g, '');

        if (!targetId) {
            return reply(ctx, { ...errorPanel('Falta el usuario', 'Menciona contra quién quieres pelear.'), ephemeral: true });
        }
        if (targetId === authorId) {
            return reply(ctx, { ...errorPanel('No puedes hacer eso', 'No puedes pelear contigo mismo.'), ephemeral: true });
        }

        const winnerId = Math.random() < 0.5 ? authorId : targetId;
        const loserId = winnerId === authorId ? targetId : authorId;

        return reply(ctx, infoPanel('⚔️ ¡Pelea!', `<@${authorId}> vs <@${targetId}>...\n\n🏆 **<@${winnerId}> gana la pelea!**\n<@${loserId}> queda fuera de combate.`));
    },
};
