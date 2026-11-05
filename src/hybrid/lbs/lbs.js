const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lbs')
        .setDescription('Convierte kilogramos a libras')
        .addNumberOption(o => o.setName('kilos').setDescription('Cantidad en kilogramos').setRequired(true)),

    name: 'lbs',
    aliases: ['libras'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const kg = isSlash(ctx) ? ctx.options.getNumber('kilos') : parseFloat(args[0]);
        if (Number.isNaN(kg)) {
            return reply(ctx, { ...errorPanel('Valor inválido', 'Especifica una cantidad válida.'), ephemeral: true });
        }

        const lbs = kg / 0.453592;
        return reply(ctx, infoPanel('Conversión de peso', `**${kg} kg** = **${lbs.toFixed(2)} lbs**`));
    },
};
