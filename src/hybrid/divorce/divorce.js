const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('divorce')
        .setDescription('Divórciate de alguien (de broma)')
        .addUserOption(o => o.setName('usuario').setDescription('Tu ex').setRequired(true)),

    name: 'divorce',
    aliases: ['divorciar'],
    category: 'diversión',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        const authorId = getUserId(ctx);
        const targetId = isSlash(ctx) ? ctx.options.getUser('usuario')?.id : args[0]?.replace(/[<@!>]/g, '');

        if (!targetId) {
            return reply(ctx, { ...errorPanel('Falta el usuario', 'Menciona de quién te quieres divorciar.'), ephemeral: true });
        }

        return reply(ctx, infoPanel('💔 Divorcio', `<@${authorId}> se ha divorciado de <@${targetId}>. Que la próxima vaya mejor.`));
    },
};
