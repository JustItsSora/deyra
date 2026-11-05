const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('isleapyear')
        .setDescription('Verifica si un año es bisiesto')
        .addIntegerOption(o => o.setName('ano').setDescription('El año').setRequired(true)),

    name: 'isleapyear',
    aliases: ['esbisiesto'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const year = isSlash(ctx) ? ctx.options.getInteger('ano') : parseInt(args[0], 10);
        if (Number.isNaN(year)) {
            return reply(ctx, { ...errorPanel('Valor inválido', 'Especifica un año válido.'), ephemeral: true });
        }

        const leap = isLeapYear(year);
        return reply(ctx, infoPanel('Año bisiesto', `**${year}** ${leap ? 'ES' : 'NO es'} un año bisiesto.`));
    },
};
