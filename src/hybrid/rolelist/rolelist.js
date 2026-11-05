const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rolelist')
        .setDescription('Lista todos los roles del servidor'),

    name: 'rolelist',
    aliases: ['roles'],
    category: 'utilidad',
    cooldownMs: 3000,

    async execute(ctx) {
        const roles = ctx.guild.roles.cache
            .filter(r => r.id !== ctx.guild.id)
            .sort((a, b) => b.position - a.position);

        if (roles.size === 0) {
            return reply(ctx, infoPanel('Roles del servidor', 'Este servidor no tiene roles adicionales.'));
        }

        const lines = roles.map(r => `${r} — ${r.members.size} miembro(s)`).slice(0, 40);
        return reply(ctx, infoPanel(`Roles del servidor (${roles.size})`, undefined, { lines }));
    },
};
