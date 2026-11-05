const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');
const { Giveaway } = require('../../data/models');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveawaylist')
        .setDescription('Lista los sorteos activos del servidor'),

    name: 'giveawaylist',
    aliases: ['sorteos'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx) {
        const active = await Giveaway.findAll({ where: { guildId: ctx.guild.id, ended: false } });

        if (active.length === 0) {
            return reply(ctx, infoPanel('🎉 Sorteos activos', 'No hay sorteos activos en este servidor.'));
        }

        const lines = active.map(g => `**${g.prize}** — termina <t:${Math.floor(g.endsAt.getTime() / 1000)}:R> — [ID: ${g.messageId}]`);
        return reply(ctx, infoPanel('🎉 Sorteos activos', undefined, { lines }));
    },
};
