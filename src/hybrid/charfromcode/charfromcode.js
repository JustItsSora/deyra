const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('charfromcode')
        .setDescription('Muestra el carácter correspondiente a un código Unicode/ASCII')
        .addIntegerOption(o => o.setName('codigo').setDescription('Código decimal').setMinValue(0).setMaxValue(1114111).setRequired(true)),

    name: 'charfromcode',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const code = isSlash(ctx) ? ctx.options.getInteger('codigo') : parseInt(args[0], 10);
        if (Number.isNaN(code) || code < 0 || code > 1114111) {
            return reply(ctx, { ...errorPanel('Código inválido', 'Especifica un código Unicode válido (0-1114111).'), ephemeral: true });
        }

        try {
            const char = String.fromCodePoint(code);
            return reply(ctx, infoPanel('Carácter desde código', `Código **${code}** = **"${char}"**`));
        } catch {
            return reply(ctx, { ...errorPanel('Error', 'No pude generar un carácter con ese código.'), ephemeral: true });
        }
    },
};
