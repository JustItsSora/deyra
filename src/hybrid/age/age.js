const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('age')
        .setDescription('Calcula tu edad exacta a partir de tu fecha de nacimiento')
        .addIntegerOption(o => o.setName('dia').setDescription('Día').setMinValue(1).setMaxValue(31).setRequired(true))
        .addIntegerOption(o => o.setName('mes').setDescription('Mes').setMinValue(1).setMaxValue(12).setRequired(true))
        .addIntegerOption(o => o.setName('ano').setDescription('Año').setMinValue(1900).setMaxValue(2026).setRequired(true)),

    name: 'age',
    aliases: ['edad'],
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

        const birth = new Date(year, month - 1, day);
        const now = new Date();
        if (birth > now) {
            return reply(ctx, { ...errorPanel('Fecha inválida', 'Esa fecha está en el futuro.'), ephemeral: true });
        }

        let age = now.getFullYear() - birth.getFullYear();
        const hasHadBirthdayThisYear = (now.getMonth() > birth.getMonth()) || (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
        if (!hasHadBirthdayThisYear) age -= 1;

        const daysAlive = Math.floor((now - birth) / 86400000);

        return reply(ctx, infoPanel('🎂 Tu edad', `**${age} años**\nHas vivido aproximadamente **${daysAlive.toLocaleString('es-ES')}** días.`));
    },
};
