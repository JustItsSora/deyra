const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { successPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('jsonvalidate')
        .setDescription('Verifica si un texto es JSON válido')
        .addStringOption(o => o.setName('json').setDescription('El JSON a validar').setRequired(true)),

    name: 'jsonvalidate',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const raw = isSlash(ctx) ? ctx.options.getString('json') : args.join(' ');
        if (!raw) {
            return reply(ctx, { ...errorPanel('Falta el JSON', 'Especifica el JSON a validar.'), ephemeral: true });
        }

        try {
            JSON.parse(raw);
            return reply(ctx, successPanel('JSON válido', 'El texto proporcionado es JSON válido.'));
        } catch (err) {
            return reply(ctx, errorPanel('JSON inválido', `Error: ${err.message}`));
        }
    },
};
