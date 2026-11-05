const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('norole')
        .setDescription('Lista los miembros que no tienen ningún rol asignado'),

    name: 'norole',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 3000,

    async execute(ctx) {
        await ctx.guild.members.fetch();
        const withoutRole = ctx.guild.members.cache.filter(m => m.roles.cache.size === 1 && !m.user.bot); // solo @everyone

        if (withoutRole.size === 0) {
            return reply(ctx, infoPanel('Sin roles', 'Todos los miembros tienen al menos un rol.'));
        }

        const lines = [...withoutRole.values()].slice(0, 40).map(m => `${m}`);
        return reply(ctx, infoPanel(`Miembros sin rol (${withoutRole.size})`, undefined, { lines }));
    },
};
