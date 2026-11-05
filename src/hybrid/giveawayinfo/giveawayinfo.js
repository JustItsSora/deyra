const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');
const { Giveaway } = require('../../data/models');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveawayinfo')
        .setDescription('Muestra información detallada de un sorteo')
        .addStringOption(o => o.setName('message_id').setDescription('ID del mensaje del sorteo').setRequired(true)),

    name: 'giveawayinfo',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const messageId = isSlash(ctx) ? ctx.options.getString('message_id') : args[0];
        const giveaway = await Giveaway.findOne({ where: { guildId: ctx.guild.id, messageId } });

        if (!giveaway) {
            return reply(ctx, { ...errorPanel('No encontrado', 'No hay un sorteo con ese ID de mensaje.'), ephemeral: true });
        }

        const entrants = JSON.parse(giveaway.entrants || '[]');
        const winners = JSON.parse(giveaway.winners || '[]');

        const lines = [
            `**Premio:** ${giveaway.prize}`,
            `**Estado:** ${giveaway.ended ? 'Finalizado' : 'Activo'}`,
            `**Participantes:** ${entrants.length}`,
            `**Ganadores esperados:** ${giveaway.winnerCount}`,
        ];
        if (giveaway.ended && winners.length > 0) {
            lines.push(`**Ganador(es):** ${winners.map(id => `<@${id}>`).join(', ')}`);
        }

        return reply(ctx, infoPanel('🎉 Información del sorteo', undefined, { lines }));
    },
};
