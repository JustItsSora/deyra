const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daysinmonth')
        .setDescription('Muestra cuántos días tiene un mes en un año específico')
        .addIntegerOption(o => o.setName('mes').setDescription('Mes (1-12)').setMinValue(1).setMaxValue(12).setRequired(true))
        .addIntegerOption(o => o.setName('ano').setDescription('Año').setRequired(true)),

    name: 'daysinmonth',
    aliases: ['diasenmes'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        let month, year;
        if (isSlash(ctx)) {
            month = ctx.options.getInteger('mes');
            year = ctx.options.getInteger('ano');
        } else {
            month = parseInt(args[0], 10);
            year = parseInt(args[1], 10);
        }

        if (!month || !year) {
            return reply(ctx, { ...errorPanel('Datos inválidos', 'Especifica mes y año válidos.'), ephemeral: true });
        }

        const days = new Date(year, month, 0).getDate();
        return reply(ctx, infoPanel('Días en el mes', `El mes **${month}/${year}** tiene **${days}** días.`));
    },
};
