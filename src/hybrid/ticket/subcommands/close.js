const { reply, isSlash, getUserId } = require('../../../lib/reply');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { Ticket, TicketConfig } = require('../../../data/models');
const { buildPanel } = require('../../../lib/panel');
const { MessageFlags } = require('discord.js');

module.exports = {
    async execute(ctx, args) {
        const ticket = await Ticket.findOne({ where: { channelId: ctx.channel.id } });
        if (!ticket) {
            return reply(ctx, { ...errorPanel('No es un ticket', 'Este comando solo funciona dentro de un canal de ticket.'), ephemeral: true });
        }

        const reason = isSlash(ctx) ? (ctx.options.getString('razon') || 'Sin razón especificada') : (args.join(' ') || 'Sin razón especificada');
        const executorId = getUserId(ctx);

        ticket.status = 'closed';
        ticket.closedBy = executorId;
        ticket.closedAt = new Date();
        ticket.reason = reason;
        await ticket.save();

        await reply(ctx, successPanel('Cerrando ticket', `Razón: ${reason}\n\nEste canal se eliminará en unos segundos.`));

        const config = await TicketConfig.findOne({ where: { guildId: ctx.guild.id } });
        if (config?.logChannelId) {
            const logChannel = await ctx.guild.channels.fetch(config.logChannelId).catch(() => null);
            if (logChannel) {
                await logChannel.send({
                    components: [buildPanel({
                        title: `Ticket #${ticket.ticketNumber} cerrado`,
                        description: `**Usuario:** <@${ticket.userId}>\n**Cerrado por:** <@${executorId}>\n**Razón:** ${reason}`,
                        tone: 'neutral',
                    })],
                    flags: MessageFlags.IsComponentsV2,
                }).catch(() => {});
            }
        }

        setTimeout(() => ctx.channel.delete().catch(() => {}), 5000);
    },
};
