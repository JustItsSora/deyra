const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');
const { Ticket } = require('../../data/models');
const { Op } = require('sequelize');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticketopen')
        .setDescription('Lista los tickets abiertos o reclamados actualmente'),

    name: 'ticketopen',
    aliases: [],
    category: 'tickets',
    cooldownMs: 3000,

    async execute(ctx) {
        const tickets = await Ticket.findAll({
            where: { guildId: ctx.guild.id, status: { [Op.in]: ['open', 'claimed'] } },
            order: [['ticketNumber', 'ASC']],
        });

        if (tickets.length === 0) {
            return reply(ctx, infoPanel('🎫 Tickets abiertos', 'No hay tickets abiertos actualmente.'));
        }

        const lines = tickets.map(t => `**#${t.ticketNumber}** — <@${t.userId}> — <#${t.channelId}> — ${t.status === 'claimed' ? `Reclamado por <@${t.claimedBy}>` : 'Sin reclamar'}`);
        return reply(ctx, infoPanel(`🎫 Tickets abiertos (${tickets.length})`, undefined, { lines }));
    },
};
