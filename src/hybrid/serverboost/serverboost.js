const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverboost')
        .setDescription('Muestra el nivel de boost y beneficios actuales del servidor'),

    name: 'serverboost',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx) {
        const guild = ctx.guild;
        const tierBenefits = {
            0: 'Sin beneficios de boost',
            1: '128kbps de audio, emojis animados, banner de servidor',
            2: '256kbps de audio, más slots de emoji, banner mejorado',
            3: '384kbps de audio, URL personalizada, máximos beneficios',
        };

        const lines = [
            `**Nivel actual:** ${guild.premiumTier}`,
            `**Boosts totales:** ${guild.premiumSubscriptionCount || 0}`,
            `**Beneficios:** ${tierBenefits[guild.premiumTier] || 'Desconocido'}`,
        ];

        return reply(ctx, infoPanel('🚀 Estado de Boost', undefined, { lines }));
    },
};
