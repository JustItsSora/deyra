const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sqrt')
        .setDescription('Calcula la raíz cuadrada de un número')
        .addNumberOption(o => o.setName('numero').setDescription('Número').setMinValue(0).setRequired(true)),

    name: 'sqrt',
    aliases: ['raiz'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const n = isSlash(ctx) ? ctx.options.getNumber('numero') : parseFloat(args[0]);
        if (Number.isNaN(n) || n < 0) {
            return reply(ctx, { ...errorPanel('Valor inválido', 'Especifica un número positivo.'), ephemeral: true });
        }

        return reply(ctx, infoPanel('Raíz cuadrada', `√${n} = **${Math.sqrt(n).toFixed(4)}**`));
    },
};
