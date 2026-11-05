// /gif — buscador de GIFs por texto libre.
//
// A diferencia de los comandos sociales (/hug, /spin...), que tienen una
// categoría fija, este acepta cualquier palabra y la traduce a la categoría más
// cercana usando el diccionario de sinónimos de src/lib/gifApi.js:
//   /gif abrazos → hug      /gif hola → wave
//   /gif cosquillas → tickle /gif girada → spin
//
// Cuando no reconoce la palabra, en vez de decir "no encontré nada" devuelve
// las categorías más usadas para que el usuario sepa qué puede pedir, con
// botones que ejecutan el comando real (no hay que escribirlo a mano).

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { searchGif, GIF_CATEGORIES } = require('../../lib/gifApi');
const ui = require('../../lib/ui');

// Las 8 categorías más usadas, para el panel de sugerencias.
const POPULAR = ['hug', 'kiss', 'dance', 'pat', 'cuddle', 'poke', 'sleep', 'bonk'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gif')
        .setDescription('Busca un GIF por palabras')
        .addStringOption(o => o
            .setName('busqueda')
            .setDescription('Qué querés ver: "abrazos", "bailar", "cucaracha"...')
            .setRequired(true)),

    name: 'gif',
    aliases: ['gifs', 'buscargif'],
    category: 'diversión',
    cooldownMs: 3000,

    // Autocompletado: sugiere categorías válidas mientras el usuario escribe.
    async autocomplete(interaction) {
        const focused = interaction.options.getFocused().toLowerCase();
        const names = Object.keys(GIF_CATEGORIES);
        const filtered = (focused ? names.filter(n => n.startsWith(focused)) : names).slice(0, 25);
        await interaction.respond(filtered.map(name => ({ name, value: name }))).catch(() => {});
    },

    async execute(ctx, args = []) {
        const query = isSlash(ctx) ? ctx.options.getString('busqueda') : args.join(' ');
        if (!query) {
            return reply(ctx, ui.missingArgument(
                '¿Qué GIF querés?',
                'Decime qué estás buscando y te lo traigo.',
                { usage: '/gif abrazos' },
            ));
        }

        let result;
        try {
            result = await searchGif(query);
        } catch (err) {
            console.error('[gif] Error:', err.message);
            return reply(ctx, ui.error(
                'No pude buscar',
                'Las fuentes de GIFs no están respondiendo ahora mismo.',
                { hint: err.message.slice(0, 200), ephemeral: true },
            ));
        }

        // Sin coincidencia: sugerimos en vez de rindirnos.
        if (result.error === 'sin-coincidencia') {
            return reply(ctx, ui.payload({
                category: 'diversión',
                tone: 'warning',
                kicker: 'Sin coincidencias',
                title: `No encontré nada para "${ui.truncate(query, 40)}"`,
                icon: '🔍',
                description: 'Probá con una acción o un sentimiento. Estas son las más pedidas:',
                lists: [{
                    title: 'Sugerencias',
                    items: POPULAR.map(k => `\`/gif ${k}\``),
                    ordered: true,
                }],
                callouts: [{ tone: 'muted', text: `También podés usar: ${Object.keys(GIF_CATEGORIES).slice(0, 12).join(', ')}…` }],
                rows: [popularRow()],
            }));
        }

        return reply(ctx, ui.imagePayload({
            category: 'diversión',
            icon: '🎞️',
            kicker: 'Resultado de búsqueda',
            title: result.displayName,
            caption: `Busqué **${ui.truncate(query, 60)}** y encontré esto.`,
            media: { url: result.url, description: result.anime || null },
            source: result.source,
            author: result.anime || undefined,
            footerText: `Categoría: \`${result.category}\` · probá otras: \`/gif ${POPULAR[0]}\``,
        }));
    },
};

/** Botones que ejecutan un /gif de las categorías populares. */
function popularRow() {
    return new ActionRowBuilder().addComponents(
        ...POPULAR.slice(0, 5).map(key => new ButtonBuilder()
            .setCustomId(`gif_pick_${key}`)
            .setLabel(key)
            .setStyle(ButtonStyle.Secondary)),
    );
}

module.exports.popularRow = popularRow;
