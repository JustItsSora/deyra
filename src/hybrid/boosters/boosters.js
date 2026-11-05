const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('boosters')
        .setDescription('Lista los miembros que están boosteando el servidor'),

    name: 'boosters',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 3000,

    async execute(ctx) {
        await ctx.guild.members.fetch();
        const boosters = ctx.guild.members.cache.filter(m => m.premiumSince);

        if (boosters.size === 0) {
            return reply(ctx, infoPanel('Boosters', 'Este servidor no tiene boosters actualmente.'));
        }

        const sorted = [...boosters.values()].sort((a, b) => a.premiumSince - b.premiumSince);
        const lines = sorted.map(m => `${m} — boosteando desde <t:${Math.floor(m.premiumSince.getTime() / 1000)}:D>`).slice(0, 30);

        return reply(ctx, infoPanel(`Boosters (${boosters.size})`, undefined, { lines }));
    },
};
