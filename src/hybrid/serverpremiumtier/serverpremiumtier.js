const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

const TIER_NAMES = { 0: 'Sin nivel', 1: 'Nivel 1', 2: 'Nivel 2', 3: 'Nivel 3' };

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverpremiumtier')
        .setDescription('Muestra el nivel de boost premium actual del servidor con más detalle'),

    name: 'serverpremiumtier',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx) {
        const guild = ctx.guild;
        return reply(ctx, infoPanel('Nivel premium del servidor', `**${TIER_NAMES[guild.premiumTier]}**\n**Boosts:** ${guild.premiumSubscriptionCount || 0}\n**Slots de emoji extra:** ${guild.premiumTier * 50}`));
    },
};
