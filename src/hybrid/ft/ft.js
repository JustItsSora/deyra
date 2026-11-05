// src/hybrid/ft/ft.js
const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ft')
        .setDescription('Convierte pies y pulgadas a centímetros')
        .addNumberOption((o) => o.setName('pies').setDescription('Cantidad de pies').setRequired(true))
        .addNumberOption((o) => o.setName('pulgadas').setDescription('Cantidad de pulgadas adicionales')),

    name: 'ft',
    aliases: ['pies'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const feet = isSlash(ctx) ? ctx.options.getNumber('pies') : parseFloat(args[0]);
        const inches = isSlash(ctx) ? (ctx.options.getNumber('pulgadas') || 0) : (args[1] ? parseFloat(args[1]) : 0);

        if (Number.isNaN(feet) || Number.isNaN(inches)) {
            return reply(ctx, { ...errorPanel('Valor inválido', 'Especificá cantidades válidas.'), ephemeral: true });
        }
        if (feet < 0 || inches < 0) {
            return reply(ctx, { ...errorPanel('Valor inválido', 'Los valores no pueden ser negativos.'), ephemeral: true });
        }

        const totalInches = (feet * 12) + inches;
        const cm = totalInches * 2.54;

        return reply(ctx, infoPanel('Pies y pulgadas a centímetros', `**${feet}' ${inches}"** = **${cm.toFixed(2)} cm**`));
    },
};
