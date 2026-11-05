const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');
const crypto = require('crypto');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('love')
        .setDescription('Calcula el amor entre dos usuarios (alias de ship, con estilo distinto)')
        .addUserOption(o => o.setName('usuario1').setDescription('Primer usuario').setRequired(true))
        .addUserOption(o => o.setName('usuario2').setDescription('Segundo usuario (opcional)').setRequired(false)),

    name: 'love',
    aliases: ['amor'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const authorId = getUserId(ctx);
        let idA, idB;

        if (isSlash(ctx)) {
            idA = ctx.options.getUser('usuario1')?.id;
            idB = ctx.options.getUser('usuario2')?.id || authorId;
        } else {
            idA = args[0]?.replace(/[<@!>]/g, '');
            idB = args[1]?.replace(/[<@!>]/g, '') || authorId;
        }

        if (!idA) {
            return reply(ctx, { ...errorPanel('Falta un usuario', 'Menciona al menos un usuario.'), ephemeral: true });
        }

        const combined = [idA, idB].sort().join('-love-');
        const hash = crypto.createHash('md5').update(combined).digest('hex');
        const percent = parseInt(hash.slice(0, 8), 16) % 101;

        const hearts = '❤️'.repeat(Math.round(percent / 20)) + '🖤'.repeat(5 - Math.round(percent / 20));

        return reply(ctx, infoPanel('💕 Medidor de amor', `<@${idA}> + <@${idB}>\n\n${hearts}\n**${percent}%**`));
    },
};
