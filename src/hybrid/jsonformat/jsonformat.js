const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('jsonformat')
        .setDescription('Formatea (embellece) un JSON')
        .addStringOption(o => o.setName('json').setDescription('El JSON a formatear').setRequired(true)),

    name: 'jsonformat',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const raw = isSlash(ctx) ? ctx.options.getString('json') : args.join(' ');
        if (!raw) {
            return reply(ctx, { ...errorPanel('Falta el JSON', 'Especifica el JSON a formatear.'), ephemeral: true });
        }

        try {
            const parsed = JSON.parse(raw);
            const formatted = JSON.stringify(parsed, null, 2);
            const truncated = formatted.length > 1800 ? formatted.slice(0, 1800) + '\n...(truncado)' : formatted;
            return reply(ctx, infoPanel('JSON formateado', `\`\`\`json\n${truncated}\n\`\`\``));
        } catch (err) {
            return reply(ctx, { ...errorPanel('JSON inválido', `No pude parsear ese JSON: ${err.message}`), ephemeral: true });
        }
    },
};
