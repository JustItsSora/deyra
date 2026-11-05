const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rolehierarchy')
        .setDescription('Muestra la jerarquía de roles del servidor, de mayor a menor'),

    name: 'rolehierarchy',
    aliases: ['jerarquiaroles'],
    category: 'utilidad',
    cooldownMs: 3000,

    async execute(ctx) {
        const roles = ctx.guild.roles.cache
            .filter(r => r.id !== ctx.guild.id)
            .sort((a, b) => b.position - a.position);

        if (roles.size === 0) {
            return reply(ctx, infoPanel('Jerarquía de roles', 'Este servidor no tiene roles adicionales.'));
        }

        const lines = roles.map(r => `${roles.size - [...roles.values()].indexOf(r)}. ${r}`).slice(0, 30);
        return reply(ctx, infoPanel('📶 Jerarquía de roles', undefined, { lines }));
    },
};
