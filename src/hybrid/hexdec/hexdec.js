// src/hybrid/hexdec/hexdec.js
const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hexdec')
        .setDescription('Convierte un número hexadecimal a decimal')
        .addStringOption((o) => o.setName('hexadecimal').setDescription('Valor hexadecimal, ej: 1A3F').setRequired(true)),

    name: 'hexdec',
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        let hex = (isSlash(ctx) ? ctx.options.getString('hexadecimal') : args[0])?.trim();

        if (!hex) {
            return reply(ctx, { ...errorPanel('Falta el valor', 'Uso: `/hexdec hexadecimal:1A3F`'), ephemeral: true });
        }

        hex = hex.replace(/^0x/i, '');

        if (!/^[0-9A-Fa-f]+$/.test(hex)) {
            return reply(ctx, { ...errorPanel('Valor inválido', 'Usá solo dígitos `0-9` y letras `A-F`.'), ephemeral: true });
        }

        const decimal = parseInt(hex, 16);
        return reply(ctx, infoPanel('Hexadecimal a decimal', `**0x${hex.toUpperCase()}** = **${decimal}**`));
    },
};
