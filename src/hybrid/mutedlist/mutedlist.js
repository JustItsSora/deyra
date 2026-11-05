const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mutedlist')
        .setDescription('Lista los miembros actualmente silenciados (timeout activo)'),

    name: 'mutedlist',
    aliases: ['silenciados'],
    category: 'moderación',
    cooldownMs: 3000,

    async execute(ctx) {
        await ctx.guild.members.fetch();
        const muted = ctx.guild.members.cache.filter(m => m.isCommunicationDisabled?.());

        if (muted.size === 0) {
            return reply(ctx, infoPanel('Miembros silenciados', 'Nadie está silenciado actualmente.'));
        }

        const lines = [...muted.values()].map(m => `${m} — hasta <t:${Math.floor(m.communicationDisabledUntilTimestamp / 1000)}:R>`);
        return reply(ctx, infoPanel(`Miembros silenciados (${muted.size})`, undefined, { lines }));
    },
};
