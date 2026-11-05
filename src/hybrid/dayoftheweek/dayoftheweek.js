const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dayoftheweek')
        .setDescription('Calcula qué día de la semana fue o será una fecha')
        .addIntegerOption(o => o.setName('dia').setDescription('Día').setMinValue(1).setMaxValue(31).setRequired(true))
        .addIntegerOption(o => o.setName('mes').setDescription('Mes').setMinValue(1).setMaxValue(12).setRequired(true))
        .addIntegerOption(o => o.setName('ano').setDescription('Año').setRequired(true)),

    name: 'dayoftheweek',
    aliases: ['diadesemana'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        let day, month, year;
        if (isSlash(ctx)) {
            day = ctx.options.getInteger('dia');
            month = ctx.options.getInteger('mes');
            year = ctx.options.getInteger('ano');
        } else {
            [day, month, year] = args.map(n => parseInt(n, 10));
        }

        if (!day || !month || !year) {
            return reply(ctx, { ...errorPanel('Fecha inválida', 'Especifica día, mes y año válidos.'), ephemeral: true });
        }

        const date = new Date(year, month - 1, day);
        const dayName = DAYS[date.getDay()];

        return reply(ctx, infoPanel('📅 Día de la semana', `El ${day}/${month}/${year} fue/será **${dayName}**.`));
    },
};
