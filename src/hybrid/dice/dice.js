const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dice')
        .setDescription('Lanza uno o más dados')
        .addIntegerOption(o => o.setName('cantidad').setDescription('Número de dados (1-10)').setMinValue(1).setMaxValue(10).setRequired(false))
        .addIntegerOption(o => o.setName('caras').setDescription('Número de caras por dado (default 6)').setMinValue(2).setMaxValue(1000).setRequired(false)),

    name: 'dice',
    aliases: ['dado', 'roll'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        let count, sides;
        if (isSlash(ctx)) {
            count = ctx.options.getInteger('cantidad') || 1;
            sides = ctx.options.getInteger('caras') || 6;
        } else {
            count = parseInt(args[0], 10) || 1;
            sides = parseInt(args[1], 10) || 6;
        }

        if (count > 10 || count < 1) {
            return reply(ctx, { ...errorPanel('Cantidad inválida', 'Puedes lanzar entre 1 y 10 dados.'), ephemeral: true });
        }

        const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
        const total = rolls.reduce((a, b) => a + b, 0);

        return reply(ctx, infoPanel('🎲 Lanzamiento de dados', `**Resultados:** ${rolls.join(', ')}\n**Total:** ${total}`));
    },
};
