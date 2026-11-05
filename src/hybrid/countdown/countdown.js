const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('countdown')
        .setDescription('Muestra cuánto falta para una fecha específica')
        .addIntegerOption(o => o.setName('dia').setDescription('Día').setMinValue(1).setMaxValue(31).setRequired(true))
        .addIntegerOption(o => o.setName('mes').setDescription('Mes').setMinValue(1).setMaxValue(12).setRequired(true))
        .addIntegerOption(o => o.setName('ano').setDescription('Año').setMinValue(2024).setMaxValue(2100).setRequired(true)),

    name: 'countdown',
    aliases: ['cuentaregresiva'],
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
        const now = new Date();
        const diffMs = target - now;

        if (diffMs < 0) {
            return reply(ctx, infoPanel('⏳ Cuenta regresiva', 'Esa fecha ya pasó.'));
        }

        const days = Math.floor(diffMs / 86400000);
        const hours = Math.floor((diffMs % 86400000) / 3600000);

        return reply(ctx, infoPanel('⏳ Cuenta regresiva', `Faltan **${days} días y ${hours} horas** para el ${day}/${month}/${year}.\n<t:${Math.floor(target.getTime() / 1000)}:R>`));
    },
};
