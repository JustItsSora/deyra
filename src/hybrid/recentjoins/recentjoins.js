const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('recentjoins')
        .setDescription('Muestra los últimos miembros en unirse al servidor'),

    name: 'recentjoins',
    aliases: ['ultimosjoins'],
    category: 'utilidad',
    cooldownMs: 3000,

    async execute(ctx) {
        await ctx.guild.members.fetch();
        const sorted = [...ctx.guild.members.cache.values()]
            .filter(m => m.joinedTimestamp)
            .sort((a, b) => b.joinedTimestamp - a.joinedTimestamp)
            .slice(0, 10);

        const lines = sorted.map(m => `${m} — <t:${Math.floor(m.joinedTimestamp / 1000)}:R>`);
        return reply(ctx, infoPanel('👥 Últimos en unirse', undefined, { lines }));
    },
};
