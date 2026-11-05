const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');
const { Economy } = require('../../data/models');
const { formatAmount } = require('../../lib/economyUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('economystats')
        .setDescription('Muestra estadísticas generales de la economía del servidor'),

    name: 'economystats',
    aliases: [],
    category: 'economía',
    cooldownMs: 3000,

    async execute(ctx) {
        const records = await Economy.findAll({ where: { guildId: ctx.guild.id } });

        if (records.length === 0) {
            return reply(ctx, infoPanel('📊 Estadísticas de economía', 'Todavía no hay actividad económica en este servidor.'));
        }

        const totalWallet = records.reduce((sum, r) => sum + Number(r.wallet), 0);
        const totalBank = records.reduce((sum, r) => sum + Number(r.bank), 0);
        const activeUsers = records.length;

        return reply(ctx, infoPanel('📊 Estadísticas de economía', undefined, {
            lines: [
                `**Usuarios activos:** ${activeUsers}`,
                `**Total en billeteras:** ${formatAmount(totalWallet)}`,
                `**Total en bancos:** ${formatAmount(totalBank)}`,
                `**Circulante total:** ${formatAmount(totalWallet + totalBank)}`,
            ],
        }));
    },
};
