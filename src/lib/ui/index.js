// src/lib/ui/index.js
// Punto de entrada único del sistema de diseño de Deyra.
//
// Un comando importa de acá y listo:
//
//   const { ui } = require('../../lib/ui');
//   return reply(ctx, ui.info('Clima', undefined, {
//       category: 'utilidad', icon: '🌤️',
//       grid: [['Condición', 'Despejado'], ['Temp', '21 °C']],
//   }));
//
// O, más corto, el atajo `panelInfo` / `panelError` de src/lib/panel.js.

const theme = require('./theme');
const text = require('./text');
const panel = require('./panel');
const states = require('./states');
const imagePanel = require('./imagePanel');
// Sanitizado de texto y URLs que vienen de APIs externas. Va en el índice
// porque todos los bloques de contenido deberían pasar por acá.
const sanitize = require('./sanitize');

module.exports = {
    // tokens
    theme, text, TONES: theme.TONES, CATEGORIES: theme.CATEGORIES,
    CATEGORY_LABELS: theme.CATEGORY_LABELS, ICONS: theme.ICONS, PILLS: theme.PILLS,
    BRAND: theme.BRAND, TYPE: theme.TYPE,
    // constructores
    build: panel.build, buildOne: panel.buildOne,
    payload: panel.payload, privatePayload: panel.privatePayload,
    section: panel.section, LIMITS: panel.LIMITS,
    imagePanel: imagePanel.imagePanel, imagePayload: imagePanel.imagePayload,
    // atajos de estado
    ...states,
    // bloques sueltos
    gridBlock: panel.gridBlock, statsBlock: panel.statsBlock,
    meterBlock: panel.meterBlock, mediaBlock: panel.mediaBlock,
    calloutBlock: panel.calloutBlock, listBlock: panel.listBlock,
    quoteBlock: panel.quoteBlock, proseBlock: panel.proseBlock,
    // texto (comodo tener todo en un require)
    dataGrid: text.dataGrid, statCards: text.statCards, meter: text.meter,
    progressBar: text.progressBar,
    // Doble alias: "pill" es corto, "pillFromTheme" se lee mejor junto al
    // resto de las funciones de texto.
    pill: text.pillFromTheme, pillFromTheme: text.pillFromTheme,
    code: text.code,
    truncate: text.truncate, compact: text.compact, bytes: text.bytes,
    duration: text.duration, pluralize: text.pluralize, joinAnd: text.joinAnd,
    bullets: text.bullets, numbered: text.numbered, sparkline: text.sparkline,
    // seguridad de contenido
    sanitize: sanitize.sanitize, clip: sanitize.clip,
    isSafeMediaUrl: sanitize.isSafeMediaUrl, filterMedia: sanitize.filterMedia,
};
