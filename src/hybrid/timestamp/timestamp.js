const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timestamp')
        .setDescription('Genera un timestamp de Discord a partir de fecha/hora')
        .addIntegerOption(o => o.setName('minutos').setDescription('Minutos a partir de ahora (puede ser negativo)').setRequired(false)),

    name: 'timestamp',
    aliases: ['ts'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const minutes = isSlash(ctx) ? (ctx.options.getInteger('minutos') || 0) : (parseInt(args[0], 10) || 0);
        const target = Math.floor(Date.now() / 1000) + minutes * 60;

        const lines = [
            `**Corto:** <t:${target}:t> → \`<t:${target}:t>\``,
            `**Largo:** <t:${target}:T> → \`<t:${target}:T>\``,
            `**Fecha corta:** <t:${target}:d> → \`<t:${target}:d>\``,
            `**Fecha larga:** <t:${target}:D> → \`<t:${target}:D>\``,
            `**Relativo:** <t:${target}:R> → \`<t:${target}:R>\``,
        ];

        return reply(ctx, infoPanel('🕐 Timestamp de Discord', undefined, { lines }));
    },
};
