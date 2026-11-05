const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

const TO_BYTES = { b: 1, kb: 1024, mb: 1024 ** 2, gb: 1024 ** 3, tb: 1024 ** 4 };

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dataconvert')
        .setDescription('Convierte entre unidades de almacenamiento digital')
        .addNumberOption(o => o.setName('valor').setDescription('Valor a convertir').setRequired(true))
        .addStringOption(o => o.setName('desde').setDescription('Unidad de origen').setRequired(true).addChoices({ name: 'Bytes', value: 'b' }, { name: 'KB', value: 'kb' }, { name: 'MB', value: 'mb' }, { name: 'GB', value: 'gb' }, { name: 'TB', value: 'tb' }))
        .addStringOption(o => o.setName('hasta').setDescription('Unidad destino').setRequired(true).addChoices({ name: 'Bytes', value: 'b' }, { name: 'KB', value: 'kb' }, { name: 'MB', value: 'mb' }, { name: 'GB', value: 'gb' }, { name: 'TB', value: 'tb' })),

    name: 'dataconvert',
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

        if (Number.isNaN(value) || !TO_BYTES[from] || !TO_BYTES[to]) {
            return reply(ctx, { ...errorPanel('Datos inválidos', 'Unidades válidas: b, kb, mb, gb, tb.'), ephemeral: true });
        }

        const bytes = value * TO_BYTES[from];
        const result = bytes / TO_BYTES[to];

        return reply(ctx, infoPanel('Conversión de datos', `**${value} ${from.toUpperCase()}** = **${result.toFixed(4)} ${to.toUpperCase()}**`));
    },
};
