const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('temperature')
        .setDescription('Convierte temperatura entre Celsius, Fahrenheit y Kelvin')
        .addNumberOption(o => o.setName('valor').setDescription('Valor a convertir').setRequired(true))
        .addStringOption(o => o.setName('desde').setDescription('Unidad de origen').setRequired(true).addChoices({ name: 'Celsius', value: 'c' }, { name: 'Fahrenheit', value: 'f' }, { name: 'Kelvin', value: 'k' })),

    name: 'temperature',
    aliases: ['temperatura'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        let value, from;
        if (isSlash(ctx)) {
            value = ctx.options.getNumber('valor');
            from = ctx.options.getString('desde');
        } else {
            value = parseFloat(args[0]);
            from = args[1]?.toLowerCase();
        }

        if (Number.isNaN(value) || !['c', 'f', 'k'].includes(from)) {
            return reply(ctx, { ...errorPanel('Datos inválidos', 'Uso: `/temperature valor:<n> desde:<c|f|k>`'), ephemeral: true });
        }

        let celsius;
        if (from === 'c') celsius = value;
        else if (from === 'f') celsius = (value - 32) * 5 / 9;
        else celsius = value - 273.15;

        const fahrenheit = celsius * 9 / 5 + 32;
        const kelvin = celsius + 273.15;

        return reply(ctx, infoPanel('🌡️ Conversión de temperatura', undefined, {
            lines: [`**Celsius:** ${celsius.toFixed(2)}°C`, `**Fahrenheit:** ${fahrenheit.toFixed(2)}°F`, `**Kelvin:** ${kelvin.toFixed(2)}K`],
        }));
    },
};
