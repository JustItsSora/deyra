const { reply, getUserId } = require('../../../lib/reply');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { Ticket, TicketConfig } = require('../../../data/models');
const { PermissionsBitField } = require('discord.js');
const { hasPermission } = require('../../../lib/permissions');

module.exports = {
    async execute(ctx) {
        const ticket = await Ticket.findOne({ where: { channelId: ctx.channel.id } });
        if (!ticket) {
            return reply(ctx, { ...errorPanel('No es un ticket', 'Este comando solo funciona dentro de un canal de ticket.'), ephemeral: true });
        }

        const executorId = getUserId(ctx);
        const executor = ctx.guild.members.cache.get(executorId) || await ctx.guild.members.fetch(executorId).catch(() => null);

        if (!hasPermission(executor, PermissionsBitField.Flags.ManageChannels)) {
            const config = await TicketConfig.findOne({ where: { guildId: ctx.guild.id } });
            const supportRoleIds = JSON.parse(config?.supportRoleIds || '[]');
            const isSupport = executor.roles.cache.some(r => supportRoleIds.includes(r.id));
            if (!isSupport) {
                return reply(ctx, { ...errorPanel('Sin permisos', 'Solo el equipo de soporte puede reclamar tickets.'), ephemeral: true });
            }
        }

        if (ticket.status === 'claimed') {
            return reply(ctx, { ...errorPanel('Ya reclamado', `Este ticket ya fue reclamado por <@${ticket.claimedBy}>.`), ephemeral: true });
        }

        ticket.status = 'claimed';
        ticket.claimedBy = executorId;
        await ticket.save();

        return reply(ctx, successPanel('Ticket reclamado', `<@${executorId}> se ha asignado este ticket.`));
    },
};
