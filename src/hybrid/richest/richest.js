const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');
const { Economy } = require('../../data/models');
const { formatAmount } = require('../../lib/economyUtils');
const { Op, literal } = require('sequelize');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('richest')
        .setDescription('Muestra el top de usuarios más ricos del servidor'),

    name: 'richest',
    aliases: ['top'],
    category: 'economía',
    cooldownMs: 3000,

    async execute(ctx) {
        const records = await Economy.findAll({
            where: { guildId: ctx.guild.id },
            order: [[literal('wallet + bank'), 'DESC']],
            limit: 10,
        });

        if (records.length === 0) {
            return reply(ctx, infoPanel('💰 Los más ricos', 'Todavía no hay actividad económica en este servidor.'));
        }

        const medals = ['🥇', '🥈', '🥉'];
        const lines = records.map((r, i) => `${medals[i] || `#${i + 1}`} <@${r.userId}> — ${formatAmount(Number(r.wallet) + Number(r.bank))}`);

        return reply(ctx, infoPanel('💰 Los más ricos del servidor', undefined, { lines }));
    },
};
