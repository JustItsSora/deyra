// src/hybrid/socialstats/socialstats.js
const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');
const { InteractionCount } = require('../../data/models');
const { SOCIAL_ACTIONS } = require('../../lib/socialActions');
const { Op } = require('sequelize');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('socialstats')
        .setDescription('Muestra cuántas veces has interactuado con otro usuario (abrazos, besos, etc.)')
        .addUserOption(o => o.setName('usuario').setDescription('Usuario a consultar').setRequired(true)),

    name: 'socialstats',
    aliases: ['interactions'],
    category: 'diversión',

    async execute(ctx, args = []) {
        const authorId = getUserId(ctx);
        const targetId = isSlash(ctx) ? ctx.options.getUser('usuario')?.id : args[0]?.replace(/[<@!>]/g, '');

        if (!targetId) {
            return reply(ctx, { ...errorPanel('Falta el usuario', 'Especifica a quién quieres consultar.'), ephemeral: true });
        }
        if (targetId === authorId) {
            return reply(ctx, { ...errorPanel('Elige a otra persona', 'Consulta tus estadísticas con otro usuario.'), ephemeral: true });
        }

        const target = await ctx.client.users.fetch(targetId).catch(() => null);
        if (!target) return reply(ctx, { ...errorPanel('Usuario inválido', 'No pude encontrar a ese usuario.'), ephemeral: true });

        // Trae ambas direcciones: lo que yo le hice a él, y lo que él me hizo a mí.
        const records = await InteractionCount.findAll({
            where: {
                guildId: ctx.guild.id,
                [Op.or]: [
                    { fromUserId: authorId, toUserId: targetId },
                    { fromUserId: targetId, toUserId: authorId },
                ],
            },
        });

        if (records.length === 0) {
            return reply(ctx, infoPanel(`Estadísticas con ${target.username}`, 'Todavía no han interactuado (abrazos, besos, etc.) entre ustedes.'));
        }

        const mine = records.filter(r => r.fromUserId === authorId);
        const theirs = records.filter(r => r.fromUserId === targetId);

        const formatLines = (list) => list
            .sort((a, b) => b.count - a.count)
            .map(r => `${SOCIAL_ACTIONS[r.action]?.emoji || '•'} **${r.action}**: ${r.count}`);

        const lines = [];
        if (mine.length > 0) {
            lines.push('**Tú le hiciste:**');
            lines.push(...formatLines(mine));
        }
        if (theirs.length > 0) {
            lines.push('');
            lines.push(`**${target.username} te hizo:**`);
            lines.push(...formatLines(theirs));
        }

        return reply(ctx, infoPanel(`Estadísticas con ${target.username}`, undefined, { lines }));
    },
};
