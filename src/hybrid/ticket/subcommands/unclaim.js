const { reply } = require('../../../lib/reply');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { Ticket } = require('../../../data/models');

module.exports = {
    async execute(ctx) {
        const ticket = await Ticket.findOne({ where: { channelId: ctx.channel.id } });
        if (!ticket) {
            return reply(ctx, { ...errorPanel('No es un ticket', 'Este comando solo funciona dentro de un canal de ticket.'), ephemeral: true });
        }
        if (ticket.status !== 'claimed') {
            return reply(ctx, { ...errorPanel('No reclamado', 'Este ticket no está reclamado por nadie.'), ephemeral: true });
        }

        ticket.status = 'open';
        ticket.claimedBy = null;
        await ticket.save();

        return reply(ctx, successPanel('Reclamación removida', 'Este ticket vuelve a estar disponible para el equipo de soporte.'));
    },
};
