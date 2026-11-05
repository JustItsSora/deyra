const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');
const crypto = require('crypto');

function compatibilityFor(idA, idB) {
    // Determinístico: el mismo par de usuarios siempre da el mismo porcentaje.
    const combined = [idA, idB].sort().join('-');
    const hash = crypto.createHash('md5').update(combined).digest('hex');
    return parseInt(hash.slice(0, 8), 16) % 101;
}

function barFor(percent) {
    const filled = Math.round(percent / 10);
    return '█'.repeat(filled) + '░'.repeat(10 - filled);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ship')
        .setDescription('Calcula la compatibilidad entre dos usuarios')
        .addUserOption(o => o.setName('usuario1').setDescription('Primer usuario').setRequired(true))
        .addUserOption(o => o.setName('usuario2').setDescription('Segundo usuario (opcional, default: tú)').setRequired(false)),

    name: 'ship',
    aliases: [],
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

        const userA = await ctx.client.users.fetch(idA).catch(() => null);
        const userB = await ctx.client.users.fetch(idB).catch(() => null);
        if (!userA || !userB) {
            return reply(ctx, { ...errorPanel('Usuario inválido', 'No pude encontrar a uno de los usuarios.'), ephemeral: true });
        }

        const percent = compatibilityFor(idA, idB);
        const emoji = percent >= 80 ? '💞' : percent >= 50 ? '💖' : percent >= 25 ? '💔' : '💀';

        return reply(ctx, infoPanel(`${emoji} ${userA.username} + ${userB.username}`, `**Compatibilidad: ${percent}%**\n\`${barFor(percent)}\``));
    },
};
