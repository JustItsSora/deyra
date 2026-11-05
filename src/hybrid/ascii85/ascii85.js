// src/hybrid/ascii85/ascii85.js
const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

function encodeAscii85(text) {
    const buffer = Buffer.from(text);
    let encoded = '';

    for (let i = 0; i < buffer.length; i += 4) {
        let value = 0;
        const chunk = buffer.subarray(i, i + 4);

        for (let j = 0; j < chunk.length; j++) {
            value = value * 256 + chunk[j];
        }
        if (chunk.length < 4) {
            value *= 256 ** (4 - chunk.length);
        }

        if (value === 0 && chunk.length === 4) {
            encoded += 'z';
        } else {
            let result = '';
            for (let j = 0; j < 5; j++) {
                result = String.fromCharCode(33 + (value % 85)) + result;
                value = Math.floor(value / 85);
            }
            encoded += result.slice(0, chunk.length + 1);
        }
    }

    return encoded;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ascii85')
        .setDescription('Codifica texto a ASCII85')
        .addStringOption((o) => o.setName('texto').setDescription('Texto a codificar').setRequired(true)),

    name: 'ascii85',
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const text = isSlash(ctx) ? ctx.options.getString('texto') : args.join(' ');

        if (!text) {
            return reply(ctx, { ...errorPanel('Falta el texto', 'Uso: `/ascii85 texto:hola mundo`'), ephemeral: true });
        }
        if (text.length > 1000) {
            return reply(ctx, { ...errorPanel('Texto muy largo', 'Máximo 1000 caracteres.'), ephemeral: true });
        }

        try {
            const encoded = encodeAscii85(text);
            return reply(ctx, infoPanel('Codificación ASCII85', `**Entrada:** ${text}\n**Codificado:**\n\`\`\`${encoded}\`\`\``));
        } catch (_) {
            return reply(ctx, { ...errorPanel('Error', 'No se pudo codificar a ASCII85.'), ephemeral: true });
        }
    },
};
