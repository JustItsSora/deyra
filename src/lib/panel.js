// src/lib/panel.js
//
// Puente de compatibilidad. TODOS los comandos de Deyra (475) usan este módulo,
// así que en vez de reescribirlos uno por uno lo convertimos en una capa fina
// sobre el sistema de diseño nuevo (src/lib/ui/). Con este cambio, cada panel
// que ya existía pasa a tener, sin tocar el comando:
//   · jerarquía tipográfica consistente (kicker → título → cuerpo),
//   · color de acento según el tono o la categoría del comando,
//   · pie de marca,
//   · recorte automático a los límites reales de Discord.
//
// Si sos del equipo, para código NUEVO usá directamente `src/lib/ui/` o los
// atajos de acá: `panelInfo`, `panelSuccess`, `panelError`, `panelWarning`.

const { MessageFlags } = require('discord.js');
const ui = require('./ui');
const { emoji } = require('./emojis');
const config = require('../config');

/**
 * Panel genérico. Mantiene la firma histórica para no romper ningún comando:
 * buildPanel({ title, description, tone, lines, rows }).
 *
 * @param {object} opts
 * @param {string} [opts.title]
 * @param {string} [opts.description]
 * @param {'primary'|'success'|'error'|'warning'|'neutral'|'info'} [opts.tone='primary']
 * @param {string} [opts.category] Categoría del comando: define el acento.
 * @param {string[]} [opts.lines] Líneas markdown adicionales.
 * @param {import('discord.js').ActionRowBuilder[]} [opts.rows] Filas de botones.
 */
function buildPanel({ title, description, tone = 'primary', category, lines = [], rows = [], kicker, brand = true } = {}) {
    return ui.buildOne({
        title,
        description,
        tone,
        category,
        kicker,
        brand,
        fields: lines,
        rows,
    });
}

/**
 * Envuelve N contenedores como payload listo para reply/editReply/send.
 * Antes se devolvía un único ContainerBuilder; ahora puede ser una lista, que
 * es lo que espera la API cuando el panel no entra en un solo bloque.
 */
function wrap(containers) {
    const list = Array.isArray(containers) ? containers : [containers];
    return { components: list, flags: MessageFlags.IsComponentsV2 };
}

/**
 * Payload de éxito. Acepta los dos estilos:
 *   successPanel('Listo', 'Descripción', { lines, category, rows })
 *   successPanel({ title, description, lines, ... })
 */
function successPanel(a, b, c = {}) {
    const opts = typeof a === 'object' && a !== null ? { ...a, ...c } : { title: a, description: b, ...c };
    return wrap(ui.build({
        ...opts,
        tone: 'success',
        kicker: opts.kicker || 'Listo',
        icon: opts.icon === null ? null : (opts.icon || emoji('YES')),
    }));
}

/** Payload de error. Ídem, y por defecto con el icono ❌ de Deyra. */
function errorPanel(a, b, c = {}) {
    const opts = typeof a === 'object' && a !== null ? { ...a, ...c } : { title: a, description: b, ...c };
    return wrap(ui.build({
        ...opts,
        tone: 'error',
        kicker: opts.kicker || 'Algo salió mal',
        icon: opts.icon === null ? null : (opts.icon || emoji('NO')),
    }));
}

/** Payload informativo (tono primario, el estilo por defecto de Deyra). */
function infoPanel(a, b, c = {}) {
    const opts = typeof a === 'object' && a !== null ? { ...a, ...c } : { title: a, description: b, ...c };
    return wrap(ui.build({ ...opts, tone: opts.tone || 'primary' }));
}

/** Payload de advertencia (tono amarillo) para avisos que no son error duro. */
function warningPanel(a, b, c = {}) {
    const opts = typeof a === 'object' && a !== null ? { ...a, ...c } : { title: a, description: b, ...c };
    return wrap(ui.build({
        ...opts,
        tone: 'warning',
        icon: opts.icon === null ? null : (opts.icon || emoji('WARNING')),
    }));
}

/**
 * Grilla de datos alineada (reemplaza las listas "**Clave:** valor" sueltas).
 * @param {Array<[string, string]>} rows
 * @param {object} [opts] ver src/lib/ui/text.js#dataGrid
 */
function dataGrid(rows, opts) {
    return ui.dataGrid(rows, opts);
}

/** Barra de progreso / medidor. */
function meter(entries, opts) {
    return ui.meter(entries, opts);
}

/** Tarjetas de métricas. */
function statCards(cards, opts) {
    return ui.statCards(cards, opts);
}

/**
 * PANEL CONTAINER (un solo bloque, como el histórico `buildPanel`) a partir de
 * las opciones nuevas del sistema de diseño. Para código nuevo preferí estos
 * atajos: son los que aceptan grilla, tarjetas, barras, media y listas.
 *
 *   panelInfo({ title, icon, category, grid, stats, media, rows })
 *
 * @param {import('./ui/panel').PanelOptions} opts
 * @returns {ContainerBuilder}
 */
function panel(opts = {}) {
    return ui.buildOne(opts);
}

/** Igual que `panel()` pero devuelve el payload listo para `reply()`. */
function panelPayload(opts = {}) {
    return wrap([ui.buildOne(opts)]);
}

/** Versión efímera de `panelPayload()`. */
function panelPrivate(opts = {}) {
    const { MessageFlags: Flags } = require('discord.js');
    return { ...wrap([ui.buildOne(opts)]), flags: Flags.IsComponentsV2 | Flags.Ephemeral };
}

module.exports = {
    buildPanel, wrap,
    successPanel, errorPanel, infoPanel, warningPanel,
    // atajos nuevos (recomendados para código nuevo)
    panel, panelPayload, panelPrivate,
    dataGrid, meter, statCards,
    ui, config,
};
