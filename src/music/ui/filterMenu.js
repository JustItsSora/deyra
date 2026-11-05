// src/music/ui/filterMenu.js
//
// Menú de filtros de audio. Un solo archivo arma el panel para las dos cosas
// que lo necesitan:
//
//   · /filter listar          → lo manda el comando como respuesta efímera.
//   · los botones `music_f…`  → lo re-dibuja el musicHandler cuando alguien
//                               elige un preset, sin hacer un collector.
//
// Por eso devuelve el ContainerBuilder y no un payload: el comando lo envuelve
// con `wrap()`/ephemeral y el handler lo manda tal cual en un `edit`.
//
// Los botones son persistentes a propósito. El menú del bot viejo usaba un
// collector de 5 minutos clavado a la respuesta del comando: si nadie tocaba
// un botón, el panel dejaba de responder y el usuario veía botones muertos sin
// explicación. Acá los maneja el dispatcher global de customIds
// (src/gateway/interactions/musicHandler.js), que vive mientras el player
// exista.

const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { emoji } = require('../../lib/emojis');
const ui = require('../../lib/ui');
const { PRESET_NAMES, describe, activeFilter } = require('../filters');

const PER_PAGE = 5;

/** Etiqueta corta para el botón (Discord corta los labels largos). */
function buttonLabel(name) {
    const label = describe(name)?.label || name;
    return label.length > 20 ? label.slice(0, 19) + '…' : label;
}

/**
 * @param {import('kazagumo').KazagumoPlayer} player
 * @param {number} [page] página 0-based
 * @returns {import('discord.js').ContainerBuilder}
 */
function buildFilterMenu(player, page = 0) {
    const names = PRESET_NAMES;
    const pages = Math.max(1, Math.ceil(names.length / PER_PAGE));
    const current = Math.max(0, Math.min(page, pages - 1));
    const start = current * PER_PAGE;
    const visible = names.slice(start, start + PER_PAGE);

    const active = activeFilter(player);

    // La grilla muestra el catálogo completo (con el activo marcado) y los
    // botones solo la página actual: mostrar 11 botones en un panel rompe el
    // límite de 5 por fila y queda ilegible.
    const rows = names.map((name) => {
        const info = describe(name);
        return [info.label, active === name ? 'activo' : info.description];
    });

    const presetRow = new ActionRowBuilder().addComponents(
        visible.map((name) => new ButtonBuilder()
            .setCustomId(`music_filter_${name}`)
            .setLabel(buttonLabel(name))
            .setStyle(active === name ? ButtonStyle.Success : ButtonStyle.Secondary)
            .setDisabled(active === name)
        ),
    );

    const navRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`music_filter_page_${Math.max(0, current - 1)}`)
            .setLabel('Anterior')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji(emoji('PREV'))
            .setDisabled(current === 0),
        new ButtonBuilder()
            .setCustomId(`music_filter_page_${Math.min(pages - 1, current + 1)}`)
            .setLabel('Siguiente')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji(emoji('NEXT'))
            .setDisabled(current >= pages - 1),
        new ButtonBuilder()
            .setCustomId('music_filter_clear')
            .setLabel('Quitar filtro')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(!active),
    );

    return ui.buildOne({
        category: 'música',
        kicker: 'Filtros de audio',
        title: active
            ? `Activo: ${describe(active)?.label || active}`
            : 'Elegí un filtro',
        icon: emoji('MUSIC'),
        description: active
            ? `**${describe(active)?.label}** está sonando ahora mismo. Aplicar otro filtro lo reemplaza.`
            : 'Cada preset combina ecualización de 14 bandas y, en algunos casos, velocidad o rotación.',
        grid: rows,
        rows: [presetRow, navRow],
        lists: [{
            title: 'Una cosa que hay que saber',
            items: [
                'Lavalink no arrastra los filtros de una canción a la siguiente, pero Deyra los reaplica solo.',
                'Si un filtro queda a medias, es que el nodo de música se reinició: usá `/filter quitar` y aplicá de nuevo.',
            ],
        }],
        footerText: `Página ${current + 1} de ${pages}`,
    });
}

module.exports = { buildFilterMenu, PER_PAGE };
