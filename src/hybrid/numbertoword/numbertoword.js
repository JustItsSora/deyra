const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

const UNITS = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
const TEENS = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
const TENS = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];

function numberToWord(n) {
    if (n < 10) return UNITS[n];
    if (n < 20) return TEENS[n - 10];
    if (n < 100) {
        const ten = Math.floor(n / 10);
        const unit = n % 10;
        return unit === 0 ? TENS[ten] : `${TENS[ten]} y ${UNITS[unit]}`;
    }
    return null; // fuera de rango soportado
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('numbertoword')
        .setDescription('Convierte un número (0-99) a palabras en español')
        .addIntegerOption(o => o.setName('numero').setDescription('Número entre 0 y 99').setMinValue(0).setMaxValue(99).setRequired(true)),

    name: 'numbertoword',
    aliases: ['numeroapalabra'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const n = isSlash(ctx) ? ctx.options.getInteger('numero') : parseInt(args[0], 10);
        if (Number.isNaN(n) || n < 0 || n > 99) {
            return reply(ctx, { ...errorPanel('Valor inválido', 'Especifica un número entre 0 y 99.'), ephemeral: true });
        }

        const word = numberToWord(n);
        return reply(ctx, infoPanel('Número en palabras', `**${n}** se escribe: **${word}**`));
    },
};
