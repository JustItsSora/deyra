const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('charat')
        .setDescription('Muestra el carácter en una posición específica de un texto')
        .addStringOption(o => o.setName('texto').setDescription('El texto').setRequired(true))
        .addIntegerOption(o => o.setName('posicion').setDescription('Posición (empieza en 1)').setMinValue(1).setRequired(true)),

    name: 'charat',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        let text, position;
        if (isSlash(ctx)) {
            text = ctx.options.getString('texto');
            position = ctx.options.getInteger('posicion');
        } else {
            position = parseInt(args[args.length - 1], 10);
            text = args.slice(0, -1).join(' ');
        }

        if (!text || !position || position > text.length) {
            return reply(ctx, { ...errorPanel('Datos inválidos', 'Especifica un texto y una posición válida dentro del texto.'), ephemeral: true });
        }

        const char = text[position - 1];
        return reply(ctx, infoPanel('Carácter encontrado', `Posición **${position}**: \`${char}\``));
    },
};
