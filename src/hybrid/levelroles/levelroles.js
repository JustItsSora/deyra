const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');
const { LevelConfig } = require('../../data/models');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('levelroles')
        .setDescription('Lista las recompensas de rol por nivel configuradas'),

    name: 'levelroles',
    aliases: ['rolesnivel'],
    category: 'niveles',
    cooldownMs: 2000,

    async execute(ctx) {
        const config = await LevelConfig.findOne({ where: { guildId: ctx.guild.id } });
        const rewards = config ? JSON.parse(config.roleRewards || '{}') : {};

        const entries = Object.entries(rewards).sort((a, b) => Number(a[0]) - Number(b[0]));
        if (entries.length === 0) {
            return reply(ctx, infoPanel('Recompensas de nivel', 'No hay recompensas de rol configuradas. Usa `/level addrolereward`.'));
        }

        const lines = entries.map(([level, roleId]) => `**Nivel ${level}:** <@&${roleId}>`);
        return reply(ctx, infoPanel('🏆 Recompensas por nivel', undefined, { lines }));
    },
};
