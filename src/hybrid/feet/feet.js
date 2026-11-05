const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('feet')
        .setDescription('Convierte metros a pies')
        .addNumberOption(o => o.setName('metros').setDescription('Cantidad en metros').setRequired(true)),

    name: 'feet',
    aliases: ['pies'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const meters = isSlash(ctx) ? ctx.options.getNumber('metros') : parseFloat(args[0]);
        if (Number.isNaN(meters)) {
            return reply(ctx, { ...errorPanel('Valor inválido', 'Especifica una cantidad válida.'), ephemeral: true });
        }

        const feet = meters / 0.3048;
        return reply(ctx, infoPanel('Conversión de longitud', `**${meters} m** = **${feet.toFixed(2)} ft**`));
    },
};
