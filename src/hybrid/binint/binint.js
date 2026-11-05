// src/hybrid/binint/binint.js
const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('binint')
        .setDescription('Convierte binario a un número entero')
        .addStringOption((o) => o.setName('binario').setDescription('Valor binario, ej: 1010').setRequired(true)),

    name: 'binint',
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const binary = (isSlash(ctx) ? ctx.options.getString('binario') : args[0])?.trim();

        if (!binary) {
            return reply(ctx, { ...errorPanel('Falta el valor', 'Uso: `/binint binario:1010`'), ephemeral: true });
        }
        if (!/^[01]+$/.test(binary)) {
            return reply(ctx, { ...errorPanel('Valor inválido', 'Usá solo `0` y `1`.'), ephemeral: true });
        }

        const integer = parseInt(binary, 2);
        return reply(ctx, infoPanel('Binario a entero', `**${binary}** = **${integer}**`));
    },
};
