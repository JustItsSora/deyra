const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

const TO_KMH = { kmh: 1, mph: 1.60934, ms: 3.6, knot: 1.852 };

module.exports = {
    data: new SlashCommandBuilder()
        .setName('speedconvert')
        .setDescription('Convierte entre unidades de velocidad')
        .addNumberOption(o => o.setName('valor').setDescription('Valor a convertir').setRequired(true))
        .addStringOption(o => o.setName('desde').setDescription('Unidad de origen').setRequired(true).addChoices({ name: 'km/h', value: 'kmh' }, { name: 'mph', value: 'mph' }, { name: 'm/s', value: 'ms' }, { name: 'nudos', value: 'knot' }))
        .addStringOption(o => o.setName('hasta').setDescription('Unidad destino').setRequired(true).addChoices({ name: 'km/h', value: 'kmh' }, { name: 'mph', value: 'mph' }, { name: 'm/s', value: 'ms' }, { name: 'nudos', value: 'knot' })),

    name: 'speedconvert',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        let value, from, to;
        if (isSlash(ctx)) {
            value = ctx.options.getNumber('valor');
            from = ctx.options.getString('desde');
            to = ctx.options.getString('hasta');
        } else {
            value = parseFloat(args[0]);
            from = args[1]?.toLowerCase();
            to = args[2]?.toLowerCase();
        }

        if (Number.isNaN(value) || !TO_KMH[from] || !TO_KMH[to]) {
            return reply(ctx, { ...errorPanel('Datos inválidos', 'Unidades válidas: kmh, mph, ms, knot.'), ephemeral: true });
        }

        const kmh = value * TO_KMH[from];
        const result = kmh / TO_KMH[to];

        return reply(ctx, infoPanel('Conversión de velocidad', `**${value} ${from}** = **${result.toFixed(3)} ${to}**`));
    },
};
