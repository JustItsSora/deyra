const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

const REGIONAL = 'abcdefghijklmnopqrstuvwxyz';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('emojify')
        .setDescription('Convierte texto en letras de emoji regional')
        .addStringOption(o => o.setName('texto').setDescription('Texto (solo letras y espacios, máx 15 caracteres)').setRequired(true)),

    name: 'emojify',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const text = isSlash(ctx) ? ctx.options.getString('texto') : args.join(' ');
        if (!text) {
            return reply(ctx, { ...errorPanel('Falta el texto', 'Especifica el texto a convertir.'), ephemeral: true });
        }
        if (text.length > 15) {
            return reply(ctx, { ...errorPanel('Muy largo', 'Máximo 15 caracteres.'), ephemeral: true });
        }

        const result = [...text.toLowerCase()].map(c => {
            if (c === ' ') return '   ';
            const idx = REGIONAL.indexOf(c);
            return idx !== -1 ? String.fromCodePoint(0x1F1E6 + idx) : c;
        }).join(' ');

        return reply(ctx, infoPanel('Emojify', result));
    },
};
