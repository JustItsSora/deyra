const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timesince')
        .setDescription('Calcula cuánto tiempo ha pasado desde una fecha')
        .addIntegerOption(o => o.setName('dia').setDescription('Día').setMinValue(1).setMaxValue(31).setRequired(true))
        .addIntegerOption(o => o.setName('mes').setDescription('Mes').setMinValue(1).setMaxValue(12).setRequired(true))
        .addIntegerOption(o => o.setName('ano').setDescription('Año').setRequired(true)),

    name: 'timesince',
    aliases: ['tiempodesde'],
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

        const target = new Date(year, month - 1, day);
        const diffMs = Date.now() - target.getTime();
        const days = Math.floor(Math.abs(diffMs) / 86400000);
        const isPast = diffMs >= 0;

        return reply(ctx, infoPanel('⏳ Tiempo transcurrido', `${isPast ? 'Han pasado' : 'Faltan'} **${days.toLocaleString('es-ES')} días** ${isPast ? 'desde' : 'hasta'} el ${day}/${month}/${year}.`));
    },
};
