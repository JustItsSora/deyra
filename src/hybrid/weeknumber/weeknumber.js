const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

function getWeekNumber(date) {
    const target = new Date(date.valueOf());
    const dayNr = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
        target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    return 1 + Math.ceil((firstThursday - target) / 604800000);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('weeknumber')
        .setDescription('Muestra el número de semana actual del año'),

    name: 'weeknumber',
    aliases: ['numerosemana'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx) {
        const week = getWeekNumber(new Date());
        return reply(ctx, infoPanel('📅 Número de semana', `Estamos en la semana **${week}** del año.`));
    },
};
