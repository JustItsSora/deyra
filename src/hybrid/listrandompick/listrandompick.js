const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listrandompick')
        .setDescription('Elige N elementos al azar de una lista, sin repetir')
        .addStringOption(o => o.setName('elementos').setDescription('Elementos separados por comas').setRequired(true))
        .addIntegerOption(o => o.setName('cantidad').setDescription('Cuántos elegir').setMinValue(1).setRequired(true)),

    name: 'listrandompick',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        let raw, count;
        if (isSlash(ctx)) {
            raw = ctx.options.getString('elementos');
            count = ctx.options.getInteger('cantidad');
        } else {
            raw = args.slice(0, -1).join(' ');
            count = parseInt(args[args.length - 1], 10);
        }

        if (!raw || !count) {
            return reply(ctx, { ...errorPanel('Datos inválidos', 'Especifica elementos y cuántos elegir.'), ephemeral: true });
        }

        const items = raw.split(',').map(i => i.trim()).filter(Boolean);
        if (count > items.length) {
            return reply(ctx, { ...errorPanel('Cantidad inválida', 'No puedes elegir más elementos de los que hay en la lista.'), ephemeral: true });
        }

        const shuffled = [...items].sort(() => Math.random() - 0.5);
        const picked = shuffled.slice(0, count);

        return reply(ctx, infoPanel('🎯 Selección aleatoria', picked.join(', ')));
    },
};
