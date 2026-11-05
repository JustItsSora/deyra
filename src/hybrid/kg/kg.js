const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kg')
        .setDescription('Convierte libras a kilogramos')
        .addNumberOption(o => o.setName('libras').setDescription('Cantidad en libras').setRequired(true)),

    name: 'kg',
    aliases: ['kilos'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const lbs = isSlash(ctx) ? ctx.options.getNumber('libras') : parseFloat(args[0]);
        if (Number.isNaN(lbs)) {
            return reply(ctx, { ...errorPanel('Valor inválido', 'Especifica una cantidad válida.'), ephemeral: true });
        }

        const kg = lbs * 0.453592;
        return reply(ctx, infoPanel('Conversión de peso', `**${lbs} lbs** = **${kg.toFixed(2)} kg**`));
    },
};
