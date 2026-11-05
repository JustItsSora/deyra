// src/hybrid/strbin/strbin.js
const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('strbin')
        .setDescription('Convierte texto a binario')
        .addStringOption((o) => o.setName('texto').setDescription('Texto a convertir').setRequired(true)),

    name: 'strbin',
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const text = isSlash(ctx) ? ctx.options.getString('texto') : args.join(' ');

        if (!text) {
            return reply(ctx, { ...errorPanel('Falta el texto', 'Uso: `/strbin texto:hola`'), ephemeral: true });
        }
        if (text.length > 500) {
            return reply(ctx, { ...errorPanel('Texto muy largo', 'Máximo 500 caracteres.'), ephemeral: true });
        }

        const binary = text.split('').map((char) => char.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
        return reply(ctx, infoPanel('Texto a binario', `**Entrada:** ${text}\n**Binario:**\n\`\`\`${binary}\`\`\``));
    },
};
