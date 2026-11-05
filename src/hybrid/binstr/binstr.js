// src/hybrid/binstr/binstr.js
const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('binstr')
        .setDescription('Convierte binario a texto')
        .addStringOption((o) => o.setName('binario').setDescription('Bytes binarios separados por espacio, ej: 01001000 01101001').setRequired(true)),

    name: 'binstr',
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const input = isSlash(ctx) ? ctx.options.getString('binario') : args.join(' ');

        if (!input) {
            return reply(ctx, { ...errorPanel('Falta el valor', 'Uso: `/binstr binario:01001000 01101001`'), ephemeral: true });
        }

        const binaryArray = input.trim().replace(/\s+/g, ' ').split(' ');

        for (const bin of binaryArray) {
            if (!/^[01]+$/.test(bin)) {
                return reply(ctx, { ...errorPanel('Valor inválido', 'Usá solo `0` y `1`, separando cada byte con un espacio.'), ephemeral: true });
            }
        }

        try {
            const text = binaryArray.map((bin) => String.fromCharCode(parseInt(bin, 2))).join('');
            return reply(ctx, infoPanel('Binario a texto', `**Resultado:** ${text}`));
        } catch (_) {
            return reply(ctx, { ...errorPanel('Error', 'No se pudo convertir el binario a texto.'), ephemeral: true });
        }
    },
};
