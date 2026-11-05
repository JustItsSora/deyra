const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

const TO_M2 = { m2: 1, km2: 1000000, ft2: 0.092903, acre: 4046.86, hectare: 10000 };

module.exports = {
    data: new SlashCommandBuilder()
        .setName('areaconvert')
        .setDescription('Convierte entre unidades de área')
        .addNumberOption(o => o.setName('valor').setDescription('Valor a convertir').setRequired(true))
        .addStringOption(o => o.setName('desde').setDescription('Unidad de origen').setRequired(true).addChoices({ name: 'm²', value: 'm2' }, { name: 'km²', value: 'km2' }, { name: 'ft²', value: 'ft2' }, { name: 'Acres', value: 'acre' }, { name: 'Hectáreas', value: 'hectare' }))
        .addStringOption(o => o.setName('hasta').setDescription('Unidad destino').setRequired(true).addChoices({ name: 'm²', value: 'm2' }, { name: 'km²', value: 'km2' }, { name: 'ft²', value: 'ft2' }, { name: 'Acres', value: 'acre' }, { name: 'Hectáreas', value: 'hectare' })),

    name: 'areaconvert',
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

        if (Number.isNaN(value) || !TO_M2[from] || !TO_M2[to]) {
            return reply(ctx, { ...errorPanel('Datos inválidos', 'Unidades válidas: m2, km2, ft2, acre, hectare.'), ephemeral: true });
        }

        const m2 = value * TO_M2[from];
        const result = m2 / TO_M2[to];

        return reply(ctx, infoPanel('Conversión de área', `**${value} ${from}** = **${result.toFixed(4)} ${to}**`));
    },
};
