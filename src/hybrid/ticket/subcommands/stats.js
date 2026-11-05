const { reply } = require('../../../lib/reply');
const { infoPanel } = require('../../../lib/panel');
const { Ticket } = require('../../../data/models');

module.exports = {
    async execute(ctx) {
        const total = await Ticket.count({ where: { guildId: ctx.guild.id } });
        const open = await Ticket.count({ where: { guildId: ctx.guild.id, status: 'open' } });
        const claimed = await Ticket.count({ where: { guildId: ctx.guild.id, status: 'claimed' } });
        const closed = await Ticket.count({ where: { guildId: ctx.guild.id, status: 'closed' } });

        return reply(ctx, infoPanel('📊 Estadísticas de tickets', undefined, {
            lines: [
                `**Total histórico:** ${total}`,
                `**Abiertos:** ${open}`,
                `**Reclamados:** ${claimed}`,
                `**Cerrados:** ${closed}`,
            ],
        }));
    },
};
