const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');
const { Leveling } = require('../../data/models');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('levelstats')
        .setDescription('Muestra estadísticas generales del sistema de niveles'),

    name: 'levelstats',
    aliases: [],
    category: 'niveles',
    cooldownMs: 3000,

    async execute(ctx) {
        const records = await Leveling.findAll({ where: { guildId: ctx.guild.id } });

        if (records.length === 0) {
            return reply(ctx, infoPanel('📊 Estadísticas de niveles', 'Todavía no hay actividad de XP en este servidor.'));
        }

        const totalMessages = records.reduce((sum, r) => sum + Number(r.totalMessages), 0);
        const avgLevel = records.reduce((sum, r) => sum + r.level, 0) / records.length;
        const highestLevel = Math.max(...records.map(r => r.level));

        return reply(ctx, infoPanel('📊 Estadísticas de niveles', undefined, {
            lines: [
                `**Usuarios con XP:** ${records.length}`,
                `**Mensajes totales contados:** ${totalMessages.toLocaleString('es-ES')}`,
                `**Nivel promedio:** ${avgLevel.toFixed(1)}`,
                `**Nivel más alto:** ${highestLevel}`,
            ],
        }));
    },
};
