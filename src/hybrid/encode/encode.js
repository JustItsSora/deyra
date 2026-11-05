// src/hybrid/encode/encode.js
// NOTA DE FUSIÓN: el "encode" original de Valk tenía un bug real — el modo
// "b32" devolvía Base64 en vez de Base32. Acá se corrigió para que use el
// algoritmo de Base32 correcto (el mismo que usa el comando /base32 de
// Deyra para números, adaptado a texto).
const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

function toBase32(text) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const buffer = Buffer.from(text);
    let encoded = '';
    let bits = 0;
    let value = 0;

    for (let i = 0; i < buffer.length; i++) {
        value = (value << 8) | buffer[i];
        bits += 8;
        while (bits >= 5) {
            encoded += alphabet[(value >>> (bits - 5)) & 31];
            bits -= 5;
        }
    }
    if (bits > 0) encoded += alphabet[(value << (5 - bits)) & 31];
    while (encoded.length % 8 !== 0) encoded += '=';

    return encoded;
}

function rot13(text) {
    return text.replace(/[a-zA-Z]/g, (char) => {
        const start = char <= 'Z' ? 65 : 97;
        return String.fromCharCode(start + ((char.charCodeAt(0) - start + 13) % 26));
    });
}

const FORMATS = {
    b32: { name: 'Base32', fn: toBase32 },
    b64: { name: 'Base64', fn: (t) => Buffer.from(t).toString('base64') },
    rot13: { name: 'ROT13', fn: rot13 },
    hex: { name: 'Hexadecimal', fn: (t) => Buffer.from(t).toString('hex').toUpperCase() },
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('encode')
        .setDescription('Codifica texto a distintos formatos')
        .addStringOption((o) => o.setName('formato').setDescription('Formato de salida').setRequired(true).addChoices(
            { name: 'Base32', value: 'b32' },
            { name: 'Base64', value: 'b64' },
            { name: 'ROT13', value: 'rot13' },
            { name: 'Hexadecimal', value: 'hex' },
        ))
        .addStringOption((o) => o.setName('texto').setDescription('Texto a codificar').setRequired(true)),

    name: 'encode',
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        let format;
        let text;

        if (isSlash(ctx)) {
            format = ctx.options.getString('formato');
            text = ctx.options.getString('texto');
        } else {
            format = args[0]?.toLowerCase();
            text = args.slice(1).join(' ');
        }

        if (!format || !text) {
            return reply(ctx, { ...errorPanel('Faltan datos', 'Uso: `/encode formato:hex texto:hola`\n**Formatos:** b32, b64, rot13, hex'), ephemeral: true });
        }
        if (text.length > 1000) {
            return reply(ctx, { ...errorPanel('Texto muy largo', 'Máximo 1000 caracteres.'), ephemeral: true });
        }

        const target = FORMATS[format];
        if (!target) {
            return reply(ctx, { ...errorPanel('Formato desconocido', 'Usá uno de: `b32`, `b64`, `rot13`, `hex`.'), ephemeral: true });
        }

        try {
            const encoded = target.fn(text);
            return reply(ctx, infoPanel(`Codificación ${target.name}`, `**Entrada:** ${text}\n**Codificado:**\n\`\`\`${encoded}\`\`\``));
        } catch (_) {
            return reply(ctx, { ...errorPanel('Error', 'No se pudo codificar el texto.'), ephemeral: true });
        }
    },
};
