const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

const BIG_LETTERS = 'abcdefghijklmnopqrstuvwxyz0123456789';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bigtext')
        .setDescription('Convierte texto en emojis grandes de letra')
        .addStringOption(o => o.setName('texto').setDescription('Texto (solo letras/números, máx 15 caracteres)').setRequired(true)),

    name: 'bigtext',
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
            if (BIG_LETTERS.includes(c)) {
                return /[0-9]/.test(c) ? `${c}\u20E3` : `:regional_indicator_${c}:`;
            }
            return c;
        }).join(' ');

        return reply(ctx, infoPanel('Big Text', result));
    },
};
