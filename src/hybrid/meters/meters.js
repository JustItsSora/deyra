const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('meters')
        .setDescription('Convierte pies a metros')
        .addNumberOption(o => o.setName('pies').setDescription('Cantidad en pies').setRequired(true)),

    name: 'meters',
    aliases: ['metros'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const feet = isSlash(ctx) ? ctx.options.getNumber('pies') : parseFloat(args[0]);
        if (Number.isNaN(feet)) {
            return reply(ctx, { ...errorPanel('Valor inválido', 'Especifica una cantidad válida.'), ephemeral: true });
        }

        const meters = feet * 0.3048;
        return reply(ctx, infoPanel('Conversión de longitud', `**${feet} ft** = **${meters.toFixed(2)} m**`));
    },
};
