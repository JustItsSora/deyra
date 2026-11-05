const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bintodec')
        .setDescription('Convierte un número binario a decimal')
        .addStringOption(o => o.setName('binario').setDescription('Número binario (solo 0s y 1s)').setRequired(true)),

    name: 'bintodec',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const bin = isSlash(ctx) ? ctx.options.getString('binario') : args[0];
        if (!bin || !/^[01]+$/.test(bin)) {
            return reply(ctx, { ...errorPanel('Valor inválido', 'Especifica un número binario válido (solo 0s y 1s).'), ephemeral: true });
        }

        const dec = parseInt(bin, 2);
        return reply(ctx, infoPanel('Binario a Decimal', `**${bin}** = **${dec}**`));
    },
};
