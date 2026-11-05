const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

const TO_LITERS = { l: 1, ml: 0.001, gal: 3.78541, qt: 0.946353, cup: 0.236588 };

module.exports = {
    data: new SlashCommandBuilder()
        .setName('volumeconvert')
        .setDescription('Convierte entre unidades de volumen')
        .addNumberOption(o => o.setName('valor').setDescription('Valor a convertir').setRequired(true))
        .addStringOption(o => o.setName('desde').setDescription('Unidad de origen').setRequired(true).addChoices({ name: 'Litros', value: 'l' }, { name: 'Mililitros', value: 'ml' }, { name: 'Galones', value: 'gal' }, { name: 'Cuartos', value: 'qt' }, { name: 'Tazas', value: 'cup' }))
        .addStringOption(o => o.setName('hasta').setDescription('Unidad destino').setRequired(true).addChoices({ name: 'Litros', value: 'l' }, { name: 'Mililitros', value: 'ml' }, { name: 'Galones', value: 'gal' }, { name: 'Cuartos', value: 'qt' }, { name: 'Tazas', value: 'cup' })),

    name: 'volumeconvert',
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

        if (Number.isNaN(value) || !TO_LITERS[from] || !TO_LITERS[to]) {
            return reply(ctx, { ...errorPanel('Datos inválidos', 'Unidades válidas: l, ml, gal, qt, cup.'), ephemeral: true });
        }

        const liters = value * TO_LITERS[from];
        const result = liters / TO_LITERS[to];

        return reply(ctx, infoPanel('Conversión de volumen', `**${value} ${from}** = **${result.toFixed(3)} ${to}**`));
    },
};
