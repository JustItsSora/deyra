const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

function slugify(text) {
    return text
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quita acentos
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slugify')
        .setDescription('Convierte un texto en un slug apto para URLs')
        .addStringOption(o => o.setName('texto').setDescription('Texto a convertir').setRequired(true)),

    name: 'slugify',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const text = isSlash(ctx) ? ctx.options.getString('texto') : args.join(' ');
        if (!text) {
            return reply(ctx, { ...errorPanel('Falta el texto', 'Especifica el texto a convertir.'), ephemeral: true });
        }

        return reply(ctx, infoPanel('Slug generado', `\`${slugify(text)}\``));
    },
};
