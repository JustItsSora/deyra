const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('iseven')
        .setDescription('Verifica si un número es par')
        .addIntegerOption(o => o.setName('numero').setDescription('El número').setRequired(true)),

    name: 'iseven',
    aliases: ['espar'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const n = isSlash(ctx) ? ctx.options.getInteger('numero') : parseInt(args[0], 10);
        if (Number.isNaN(n)) {
            return reply(ctx, { ...errorPanel('Valor inválido', 'Especifica un número entero.'), ephemeral: true });
        }

        return reply(ctx, infoPanel('Par o impar', `**${n}** ${n % 2 === 0 ? 'ES' : 'NO es'} un número par.`));
    },
};
