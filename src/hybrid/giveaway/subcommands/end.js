const { reply, isSlash } = require('../../../lib/reply');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { Giveaway } = require('../../../data/models');
const { pickWinners } = require('../../../lib/giveawayUtils');

module.exports = {
    async execute(ctx) {
        if (!isSlash(ctx)) return reply(ctx, 'Usa el slash command: `/giveaway end`.');

        const messageId = ctx.options.getString('message_id');
        const giveaway = await Giveaway.findOne({ where: { guildId: ctx.guild.id, messageId } });

        if (!giveaway) {
            return reply(ctx, { ...errorPanel('No encontrado', 'No hay un sorteo con ese ID de mensaje.'), ephemeral: true });
        }
        if (giveaway.ended) {
            return reply(ctx, { ...errorPanel('Ya finalizado', 'Este sorteo ya había terminado.'), ephemeral: true });
        }

        const entrants = JSON.parse(giveaway.entrants || '[]');
        const winners = pickWinners(entrants, giveaway.winnerCount);

        giveaway.ended = true;
        giveaway.winners = JSON.stringify(winners);
        await giveaway.save();

        const channel = await ctx.guild.channels.fetch(giveaway.channelId).catch(() => null);
        if (channel && winners.length > 0) {
            const mentions = winners.map(id => `<@${id}>`).join(', ');
            await channel.send(`🎉 Ganador(es) de **${giveaway.prize}**: ${mentions}`).catch(() => {});
        }

        return reply(ctx, { ...successPanel('Sorteo finalizado', winners.length > 0 ? `Ganadores: ${winners.map(id => `<@${id}>`).join(', ')}` : 'No hubo suficientes participantes.'), ephemeral: true });
    },
};
