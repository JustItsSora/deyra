// src/hybrid/favourites/favourites.js
//
// Lista de tus canciones guardadas, con paginación por botones.
//
// El nombre en plural (favourites) es el del bot viejo y el que la gente
// searches. Se acepta también /favoritos, /favs y /guardados, porque en español
// "favoritas" y "favoritos" se usan igual y obligar a acordarse del inglés es una
// barrera innecesaria.
//
// Antes esta listaVivía en el JSONB de la tabla `music` del bot viejo y se
// armaba con paginación manual. Ahora sale de music_favorites con LIMIT/OFFSET,
// que es lo que hace que en un host de 256MB no se corte la memoria.

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { reply, getUserId } = require('../../lib/reply');
const { successPanel, warningPanel } = require('../../lib/panel');
const { formatDuration, cleanAuthorName, truncateTitle, getCleanThumbnail } = require('../../music/lib/trackFormat');
const { emoji } = require('../../lib/emojis');
const fav = require('../../music/lib/favouritesService');
const { limitsFor, isPremium } = require('../../music/lib/access');

const PER_PAGE = 10;

function buildList(rows, { page, total, userId, pageCount }) {
    const lines = rows.map((row, i) => {
        const n = page * PER_PAGE + i + 1;
        const dur = formatDuration(row.length);
        return `\`${String(n).padStart(2, ' ')}.\` [${truncateTitle(row.title, 45)}](${row.uri || 'https://youtube.com'}) — ${cleanAuthorName(row.author, 20)} \`${dur}\``;
    });

    const nav = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`favs_page_${userId}_${Math.max(0, page - 1)}`)
            .setEmoji('◀️').setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
        new ButtonBuilder()
            .setCustomId(`favs_page_${userId}_${Math.min(pageCount - 1, page + 1)}`)
            .setEmoji('▶️').setStyle(ButtonStyle.Secondary).setDisabled(page >= pageCount - 1),
    );

    return {
        ...successPanel('Tus favoritas', lines.join('\n'), {
            rows: [nav],
            lines: [`**${total}** canción${total === 1 ? '' : 'es'} guardada${total === 1 ? '' : 's'} • página ${page + 1} de ${pageCount}`],
        }),
    };
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('favourites')
        .setDescription('Muestra las canciones que guardaste')
        .addIntegerOption(o => o.setName('pagina').setDescription('Página').setMinValue(1)),

    name: 'favourites',
    aliases: ['favoritos', 'favs', 'guardados', 'favoritas'],
    category: 'música',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        const userId = getUserId(ctx);
        const pageArg = isSlash(ctx) ? ctx.options.getInteger('pagina') : parseInt(args[0], 10);
        const page = Math.max(0, (pageArg || 1) - 1);

        const { rows, count } = await fav.listFavorites(userId, { page, perPage: PER_PAGE });

        if (!count) {
            return reply(ctx, {
                ...warningPanel(
                    'Todavía no guardaste nada',
                    'Ponte una canción con `/play` y usá `/favourite` para guardarla acá. Después la podés volver a poner con `/favourite reproducir`.',
                ),
                ephemeral: true,
            });
        }

        const pageCount = Math.max(1, Math.ceil(count / PER_PAGE));
        return reply(ctx, buildList(rows, { page: Math.min(page, pageCount - 1), total: count, userId, pageCount }));
    },
};
