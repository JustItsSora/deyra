const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bmi')
        .setDescription('Calcula tu índice de masa corporal (IMC)')
        .addNumberOption(o => o.setName('peso_kg').setDescription('Peso en kilogramos').setRequired(true))
        .addNumberOption(o => o.setName('altura_m').setDescription('Altura en metros, ej: 1.75').setRequired(true)),

    name: 'bmi',
    aliases: ['imc'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        let weight, height;
        if (isSlash(ctx)) {
            weight = ctx.options.getNumber('peso_kg');
            height = ctx.options.getNumber('altura_m');
        } else {
            weight = parseFloat(args[0]);
            height = parseFloat(args[1]);
        }

        if (!weight || !height || height <= 0) {
            return reply(ctx, { ...errorPanel('Valores inválidos', 'Especifica peso y altura válidos.'), ephemeral: true });
        }

        const bmi = weight / (height * height);
        let category;
        if (bmi < 18.5) category = 'Bajo peso';
        else if (bmi < 25) category = 'Peso normal';
        else if (bmi < 30) category = 'Sobrepeso';
        else category = 'Obesidad';

        return reply(ctx, infoPanel('IMC calculado', `**IMC: ${bmi.toFixed(1)}**\n**Categoría:** ${category}\n\n-# El IMC es una referencia general, no un diagnóstico médico.`));
    },
};
