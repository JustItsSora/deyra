const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

const STONES = {
    1: 'Granate', 2: 'Amatista', 3: 'Aguamarina', 4: 'Diamante', 5: 'Esmeralda', 6: 'Perla',
    7: 'Rubí', 8: 'Peridoto', 9: 'Zafiro', 10: 'Ópalo', 11: 'Topacio', 12: 'Turquesa',
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('birthstone')
        .setDescription('Muestra la piedra de nacimiento según tu mes')
        .addIntegerOption(o => o.setName('mes').setDescription('Mes de nacimiento (1-12)').setMinValue(1).setMaxValue(12).setRequired(true)),

    name: 'birthstone',
    aliases: ['piedranacimiento'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const month = isSlash(ctx) ? ctx.options.getInteger('mes') : parseInt(args[0], 10);
        if (!month || month < 1 || month > 12) {
            return reply(ctx, { ...errorPanel('Mes inválido', 'Especifica un mes entre 1 y 12.'), ephemeral: true });
        }

        return reply(ctx, infoPanel('💎 Piedra de nacimiento', `Tu piedra de nacimiento es: **${STONES[month]}**`));
    },
};
