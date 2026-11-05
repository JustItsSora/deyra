const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stopwatch')
        .setDescription('Marca el momento actual como punto de partida (usa el timestamp de Discord)'),

    name: 'stopwatch',
    aliases: ['cronometro'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx) {
        const now = Math.floor(Date.now() / 1000);
        return reply(ctx, infoPanel('⏱️ Cronómetro iniciado', `Punto de partida: <t:${now}:T>\nTiempo transcurrido se mostrará como: <t:${now}:R>`));
    },
};
