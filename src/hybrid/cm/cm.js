// src/hybrid/cm/cm.js
const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cm')
        .setDescription('Convierte centímetros a pies y pulgadas')
        .addNumberOption((o) => o.setName('centimetros').setDescription('Cantidad en centímetros').setRequired(true)),

    name: 'cm',
    aliases: ['centimetros'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const cm = isSlash(ctx) ? ctx.options.getNumber('centimetros') : parseFloat(args[0]);
        if (Number.isNaN(cm)) {
            return reply(ctx, { ...errorPanel('Valor inválido', 'Especificá una cantidad válida.'), ephemeral: true });
        }
        if (cm < 0) {
            return reply(ctx, { ...errorPanel('Valor inválido', 'Los centímetros no pueden ser negativos.'), ephemeral: true });
        }

        const totalInches = cm / 2.54;
        const feet = Math.floor(totalInches / 12);
        const inches = totalInches % 12;

        return reply(ctx, infoPanel('Centímetros a pies y pulgadas', `**${cm} cm** = **${feet}' ${inches.toFixed(2)}"**`));
    },
};
