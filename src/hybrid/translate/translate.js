const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

// Endpoint público no-oficial de Google Translate, ampliamente usado en proyectos
// open-source sin necesidad de API key. Si falla, se informa el error al usuario.
async function translateText(text, target) {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(target)}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`translate ${res.status}`);
    const data = await res.json();
    const translated = data[0]?.map(chunk => chunk[0]).join('') || '';
    const detectedLang = data[2] || 'desconocido';
    return { translated, detectedLang };
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('translate')
        .setDescription('Traduce un texto a otro idioma')
        .addStringOption(o => o.setName('texto').setDescription('Texto a traducir').setRequired(true))
        .addStringOption(o => o.setName('idioma').setDescription('Código de idioma destino (ej: en, es, fr, ja)').setRequired(true)),

    name: 'translate',
    aliases: ['traducir'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        let text, target;
        if (isSlash(ctx)) {
            text = ctx.options.getString('texto');
            target = ctx.options.getString('idioma');
        } else {
            target = args[0];
            text = args.slice(1).join(' ');
        }

        if (!text || !target) {
            return reply(ctx, { ...errorPanel('Faltan datos', 'Uso: `/translate texto:<texto> idioma:<código>` (ej: en, es, fr).'), ephemeral: true });
        }

        try {
            const { translated, detectedLang } = await translateText(text, target);
            return reply(ctx, infoPanel('🌐 Traducción', `**De:** \`${detectedLang}\` **a:** \`${target}\`\n\n${translated}`));
        } catch (err) {
            console.error('[translate] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude traducir el texto. Verifica el código de idioma.'), ephemeral: true });
        }
    },
};
