const { reply, isSlash } = require('../../../lib/reply');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { Giveaway } = require('../../../data/models');
const { pickWinners } = require('../../../lib/giveawayUtils');

module.exports = {
    async execute(ctx) {
        if (!isSlash(ctx)) return reply(ctx, 'Usa el slash command: `/giveaway reroll`.');

        const messageId = ctx.options.getString('message_id');
        const giveaway = await Giveaway.findOne({ where: { guildId: ctx.guild.id, messageId } });

        if (!giveaway || !giveaway.ended) {
            return reply(ctx, { ...errorPanel('No disponible', 'No hay un sorteo finalizado con ese ID de mensaje.'), ephemeral: true });
        }

        const entrants = JSON.parse(giveaway.entrants || '[]');
        const winners = pickWinners(entrants, giveaway.winnerCount);
        giveaway.winners = JSON.stringify(winners);
        await giveaway.save();

        const channel = await ctx.guild.channels.fetch(giveaway.channelId).catch(() => null);
        if (channel && winners.length > 0) {
            const mentions = winners.map(id => `<@${id}>`).join(', ');
            await channel.send(`🔄 Nuevo(s) ganador(es) de **${giveaway.prize}**: ${mentions}`).catch(() => {});
        }

        return reply(ctx, { ...successPanel('Reroll realizado', winners.length > 0 ? `Nuevos ganadores: ${winners.map(id => `<@${id}>`).join(', ')}` : 'No hay suficientes participantes para un reroll.'), ephemeral: true });
    },
};
