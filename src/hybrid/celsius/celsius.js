const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('celsius')
        .setDescription('Convierte Fahrenheit a Celsius')
        .addNumberOption(o => o.setName('grados').setDescription('Temperatura en Fahrenheit').setRequired(true)),

    name: 'celsius',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const f = isSlash(ctx) ? ctx.options.getNumber('grados') : parseFloat(args[0]);
        if (Number.isNaN(f)) {
            return reply(ctx, { ...errorPanel('Valor inválido', 'Especifica una temperatura válida.'), ephemeral: true });
        }

        const c = ((f - 32) * 5) / 9;
        return reply(ctx, infoPanel('Conversión de temperatura', `**${f}°F** = **${c.toFixed(2)}°C**`));
    },
};
