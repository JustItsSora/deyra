// /avatar — genera un avatar a partir de cualquier texto.
// 17 estilos de DiceBear, todos sin API key. El texto se convierte en "seed",
// así que el mismo texto siempre da la misma imagen (se puede regenerar y
// guardar como foto de perfil del server).

const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { avatarUrl, suggestStyles, isKnownStyle, STYLES } = require('../../lib/api/avatarApi');
const ui = require('../../lib/ui');

const DEFAULT_STYLE = 'adventurer';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Genera un avatar a partir de un texto')
        .addStringOption(o => o
            .setName('texto')
            .setDescription('Palabra o nombre que define el avatar')
            .setRequired(true))
        .addStringOption(o => o
            .setName('estilo')
            .setDescription(`Estilo visual (por defecto: ${DEFAULT_STYLE})`)
            .setRequired(false)
            .addChoices(
                ...Object.entries(STYLES).slice(0, 25).map(([value, label]) => ({ name: `${value} (${label})`.slice(0, 100), value })),
            )),

    name: 'avatar',
    aliases: ['pfp', 'avatargenerator'],
    category: 'diversión',
    cooldownMs: 3000,

    async autocomplete(interaction) {
        const focused = interaction.options.getFocused();
        const options = suggestStyles(focused ? focused.value : '').map(({ name, value }) => ({ name: name.slice(0, 100), value }));
        await interaction.respond(options).catch(() => {});
    },

    async execute(ctx, args = []) {
        const slash = isSlash(ctx);
        const text = slash ? ctx.options.getString('texto') : args[0];
        const styleOption = slash ? ctx.options.getString('estilo') : args[1];

        if (!text) {
            return reply(ctx, ui.missingArgument(
                'Falta el texto',
                'Escribí algo para convertirlo en avatar: un nombre, una palabra, lo que sea.',
                { usage: '/avatar deyra adventurer' },
            ));
        }

        const style = (styleOption || DEFAULT_STYLE).toLowerCase();
        if (!isKnownStyle(style)) {
            return reply(ctx, ui.missingArgument(
                'Estilo desconocido',
                `No conozco el estilo **${ui.truncate(style, 30)}**.`,
                { usage: `Estilos: ${Object.keys(STYLES).join(', ')}` },
            ));
        }

        const url = avatarUrl(style, text, { size: 512, background: '1e3a5f' });

        return reply(ctx, ui.imagePayload({
            category: 'diversión',
            icon: '🎨',
            kicker: 'Generador de avatares',
            title: `Avatar «${ui.truncate(text, 30)}»`,
            caption: `Estilo **${style}** · generado con DiceBear.`,
            media: { url, description: `Avatar estilo ${style} para "${text}"` },
            source: 'DiceBear',
            sourceUrl: 'https://www.dicebear.com/styles/',
            footerText: `Guardá la imagen y usala como foto de perfil · otros estilos: \`/avatar ${ui.truncate(text, 20)} pixel-art\``,
        }));
    },
};
