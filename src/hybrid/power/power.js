const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('power')
        .setDescription('Calcula una potencia (base ^ exponente)')
        .addNumberOption(o => o.setName('base').setDescription('Base').setRequired(true))
        .addNumberOption(o => o.setName('exponente').setDescription('Exponente').setRequired(true)),

    name: 'power',
    aliases: ['potencia'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        let base, exp;
        if (isSlash(ctx)) {
            base = ctx.options.getNumber('base');
            exp = ctx.options.getNumber('exponente');
        } else {
            base = parseFloat(args[0]);
            exp = parseFloat(args[1]);
        }

        if (Number.isNaN(base) || Number.isNaN(exp)) {
            return reply(ctx, { ...errorPanel('Valores inválidos', 'Especifica base y exponente válidos.'), ephemeral: true });
        }

        const result = Math.pow(base, exp);
        if (!Number.isFinite(result)) {
            return reply(ctx, { ...errorPanel('Resultado inválido', 'El resultado es demasiado grande o indefinido.'), ephemeral: true });
        }

        return reply(ctx, infoPanel('Potencia', `${base}^${exp} = **${result.toLocaleString('es-ES', { maximumFractionDigits: 4 })}**`));
    },
};
