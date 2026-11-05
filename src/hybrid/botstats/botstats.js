const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('botstats')
        .setDescription('Muestra estadísticas técnicas del bot (memoria, uptime, latencia)'),

    name: 'botstats',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 3000,

    async execute(ctx) {
        const client = ctx.client;
        const mem = process.memoryUsage();
        const uptimeSec = Math.floor(process.uptime());

        const lines = [
            `**Memoria usada:** ${(mem.heapUsed / 1024 / 1024).toFixed(1)} MB`,
            `**Uptime del proceso:** ${Math.floor(uptimeSec / 3600)}h ${Math.floor((uptimeSec % 3600) / 60)}m`,
            `**Latencia WS:** ${Math.round(client.ws.ping)}ms`,
            `**Node.js:** ${process.version}`,
            `**Servidores:** ${client.guilds.cache.size}`,
        ];

        return reply(ctx, infoPanel('📊 Estadísticas técnicas', undefined, { lines }));
    },
};
