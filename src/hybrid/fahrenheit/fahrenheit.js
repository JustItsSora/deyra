const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fahrenheit')
        .setDescription('Convierte Celsius a Fahrenheit')
        .addNumberOption(o => o.setName('grados').setDescription('Temperatura en Celsius').setRequired(true)),

    name: 'fahrenheit',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const c = isSlash(ctx) ? ctx.options.getNumber('grados') : parseFloat(args[0]);
        if (Number.isNaN(c)) {
            return reply(ctx, { ...errorPanel('Valor inválido', 'Especifica una temperatura válida.'), ephemeral: true });
        }

        const f = (c * 9) / 5 + 32;
        return reply(ctx, infoPanel('Conversión de temperatura', `**${c}°C** = **${f.toFixed(2)}°F**`));
    },
};
