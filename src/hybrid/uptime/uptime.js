const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('uptime')
        .setDescription('Muestra cuánto tiempo lleva Deyra en línea'),

    name: 'uptime',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 3000,

    async execute(ctx) {
        const uptimeMs = ctx.client.uptime;
        const seconds = Math.floor(uptimeMs / 1000) % 60;
        const minutes = Math.floor(uptimeMs / 60000) % 60;
        const hours = Math.floor(uptimeMs / 3600000) % 24;
        const days = Math.floor(uptimeMs / 86400000);

        return reply(ctx, infoPanel('⏱️ Tiempo en línea', `**${days}d ${hours}h ${minutes}m ${seconds}s**`));
    },
};
