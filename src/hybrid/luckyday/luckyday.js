const { SlashCommandBuilder } = require('discord.js');
const { reply, getUserId } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');
const crypto = require('crypto');

const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('luckyday')
        .setDescription('Descubre cuál es tu día de la suerte de la semana'),

    name: 'luckyday',
    aliases: ['diasuerte'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx) {
        const userId = getUserId(ctx);
        const week = Math.floor(Date.now() / (7 * 86400000));
        const hash = crypto.createHash('md5').update(`${userId}-week-${week}`).digest('hex');
        const dayIndex = parseInt(hash.slice(0, 4), 16) % 7;

        return reply(ctx, infoPanel('📅 Día de la suerte', `Tu día de la suerte esta semana es: **${DAYS[dayIndex]}**`));
    },
};
