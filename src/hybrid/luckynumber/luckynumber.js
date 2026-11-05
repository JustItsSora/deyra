const { SlashCommandBuilder } = require('discord.js');
const { reply, getUserId } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');
const crypto = require('crypto');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('luckynumber')
        .setDescription('Descubre tu número de la suerte del día'),

    name: 'luckynumber',
    aliases: ['numerosuerte'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx) {
        const userId = getUserId(ctx);
        const today = new Date().toISOString().slice(0, 10);
        const hash = crypto.createHash('md5').update(`${userId}-${today}`).digest('hex');
        const luckyNumber = (parseInt(hash.slice(0, 6), 16) % 100) + 1;

        return reply(ctx, infoPanel('🍀 Número de la suerte', `Tu número de la suerte de hoy es: **${luckyNumber}**`));
    },
};
