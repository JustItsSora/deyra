// src/lib/ui/text.js
//
// Primitivas de texto para los paneles. Acá está el grueso de la diferencia
// entre un bloque de texto y un panel diseñado: alineación de columnas,
// barras de progreso, tarjetas de métricas y recortes que nunca rompen un
// mensaje de Discord.
//
// Nota importante sobre Discord: el texto normal se dibuja en una fuente
// PROPORCIONAL, así que "alinear" con espacios no funciona (la línea de puntos
// o la barra se ve torcida). Todo lo que necesita alineación real se
// renderiza dentro de un bloque de código, que sí es monoespaciado. Por eso
// las grillas y barras de este módulo devuelven texto con ``` alrededor.

// --- Ancho y recorte --------------------------------------------------------

// Rangos de caracteres que ocupan 2 columnas en una fuente monoespaciada
// (CJK, emojis, símbolos). Suficiente para los casos reales de un bot.
const WIDE_RANGES = [
    [0x1100, 0x115f], [0x2329, 0x232a], [0x2e80, 0x303e], [0x3041, 0x33ff],
    [0x3400, 0x4dbf], [0x4e00, 0x9fff], [0xa000, 0xa4cf], [0xa960, 0xa97f],
    [0xac00, 0xd7a3], [0xf900, 0xfaff], [0xfe10, 0xfe19], [0xfe30, 0xfe6f],
    [0xff00, 0xff60], [0xffe0, 0xffe6], [0x1f004, 0x1f004], [0x1f0cf, 0x1f0cf],
    [0x1f18e, 0x1f18e], [0x1f191, 0x1f19a], [0x1f200, 0x1f320], [0x1f32d, 0x1f335],
    [0x1f337, 0x1f37c], [0x1f37e, 0x1f393], [0x1f3a0, 0x1f3ca], [0x1f3cf, 0x1f3d3],
    [0x1f3e0, 0x1f3f0], [0x1f3f4, 0x1f3f4], [0x1f3f8, 0x1f43e], [0x1f440, 0x1f440],
    [0x1f442, 0x1f4fc], [0x1f4ff, 0x1f53d], [0x1f54b, 0x1f54e], [0x1f550, 0x1f567],
    [0x1f57a, 0x1f57a], [0x1f595, 0x1f596], [0x1f5a4, 0x1f5a4], [0x1f5fb, 0x1f64f],
    [0x1f680, 0x1f6c5], [0x1f6cc, 0x1f6cc], [0x1f6d0, 0x1f6d2], [0x1f6d5, 0x1f6d7],
    [0x1f6eb, 0x1f6ec], [0x1f6f4, 0x1f6fc], [0x1f7e0, 0x1f7eb], [0x1f90c, 0x1f93a],
    [0x1f93c, 0x1f945], [0x1f947, 0x1f978], [0x1f97a, 0x1f9cb], [0x1f9cd, 0x1f9ff],
    [0x1fa70, 0x1fa74], [0x1fa78, 0x1fa7a], [0x1fa80, 0x1fa86], [0x1fa90, 0x1faac],
    [0x1fab0, 0x1faba], [0x1fac0, 0x1fac5], [0x1fad0, 0x1fad9], [0x1fae0, 0x1fae7],
    [0x1faf0, 0x1faf6],
];

const ZERO_WIDTH = /[\u200b-\u200f\ufe0e\ufe0f\u20e3]|[\u{1F3FB}-\u{1F3FF}]/gu;

function isWide(code) {
    for (const [a, b] of WIDE_RANGES) {
        if (code >= a && code <= b) return true;
        if (code < a) return false; // lista ordenada: si nos pasamos, no es ancho
    }
    return false;
}

/** Quita el markdown de énfasis para poder MEDIR el texto que se ve en pantalla. */
function plainText(str) {
    return String(str)
        .replace(/<a?:([a-zA-Z0-9_]{2,32}):(\d{15,25})>/g, 'xx')
        .replace(/<a?:\d+:\d+>/g, 'xx')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/`{1,3}/g, '')
        .replace(/(\*\*\*|\*\*|\*|__|_|~~)/g, '')
        .replace(/^>\s?/gm, '')
        .replace(/^[-*+]\s+/gm, '')
        .replace(ZERO_WIDTH, '');
}

/**
 * Ancho visible de un string, en columnas monoespaciadas.
 * @param {string} str
 * @param {{raw?: boolean}} [opts] raw=true mide el markdown literal (para código)
 */
function width(str, { raw = false } = {}) {
    const text = raw ? String(str) : plainText(str);
    let total = 0;
    for (const ch of text) {
        const cp = ch.codePointAt(0);
        if (cp === 0x0a) continue; // en grillas cada línea se mide por separado
        total += isWide(cp) ? 2 : 1;
    }
    return total;
}

/** Rellena a la derecha hasta `size` columnas. */
function padEnd(str, size) {
    const diff = size - width(str);
    return diff > 0 ? `${str}${' '.repeat(diff)}` : str;
}

/** Rellena a la izquierda hasta `size` columnas. */
function padStart(str, size) {
    const diff = size - width(str);
    return diff > 0 ? `${' '.repeat(diff)}${str}` : str;
}

/** Rellena según `'left' | 'right' | 'center'`. */
function pad(str, size, align = 'left') {
    if (align === 'right') return padStart(str, size);
    if (align === 'center') {
        const diff = Math.max(0, size - width(str));
        const left = Math.floor(diff / 2);
        return `${' '.repeat(left)}${str}${' '.repeat(diff - left)}`;
    }
    return padEnd(str, size);
}

/** Quita el markdown y recorta a `max` caracteres reales, con puntos suspensivos. */
function plain(str) {
    return plainText(str).trim();
}

/**
 * Recorta respetando el límite de Discord sin cortar un token de markdown
 * por la mitad ni dejar un `**` colgando. Prefiere cortar por palabra.
 * @param {string} str
 * @param {number} max
 */
function truncate(str, max = 2000) {
    const text = String(str ?? '');
    if (text.length <= max) return text;
    const slice = text.slice(0, max - 1);
    // Si estamos adentro de un **...** o `...`, cerramos para no romper el formato.
    const bold = (slice.match(/\*\*/g) || []).length;
    const code = (slice.match(/`/g) || []).length;
    let suffix = '…';
    if (bold % 2 === 1) suffix += '**';
    if (code % 2 === 1) suffix += '`';
    const lastSpace = slice.lastIndexOf(' ');
    const body = lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice;
    return `${body.replace(/\s+$/, '')}${suffix}`;
}

/** Igual que truncate pero el límite cuenta el texto YA Markdown-stripped. */
function truncateVisible(str, max = 2000) {
    const text = String(str ?? '');
    if (width(text) <= max) return text;
    let out = '';
    let used = 0;
    for (const ch of text) {
        const w = width(ch, { raw: true });
        if (used + w > max - 1) break;
        out += ch;
        used += w;
    }
    return `${out.replace(/\s+$/, '')}…`;
}

/** Escapa los caracteres de markdown de Discord. */
function escapeMd(str) {
    return String(str ?? '').replace(/([\\*_~`|>])/g, '\\$1');
}

/** Bloque de código. `lang` vacío = sin highlighting. */
function code(text, lang = '') {
    const body = String(text).replace(/```/g, "`\u200b``");
    return `\`\`\`${lang}\n${body}\n\`\`\``;
}

// --- Grilla de datos --------------------------------------------------------

/**
 * Grilla de dos columnas alineadas (etiqueta / valor) en un bloque de código.
 * Es el reemplazo directo de las listas `**Clave:** valor` sin alinear: mismo
 * dato, pero con columnas que se leen como una tabla.
 *
 * @param {Array<[string, string]|{label: string, value: string, align?: 'left'|'right'}}>} rows
 * @param {{maxLabel?: number, maxValue?: number, align?: 'left'|'right', style?: 'plain'|'leader'}} [opts]
 *   `leader` dibuja puntos entre etiqueta y valor (guía visual); `plain` usa
 *   solo espacios.
 * @returns {string} bloque de código listo para un TextDisplay
 */
function dataGrid(rows, { maxLabel = 22, maxValue = 28, align = 'left', style = 'plain' } = {}) {
    const items = rows
        .filter(Boolean)
        .map((r) => (Array.isArray(r) ? { label: r[0], value: r[1] } : r))
        .map((r) => ({ label: String(r.label ?? ''), value: String(r.value ?? ''), align: r.align || align }))
        .filter((r) => r.label || r.value);

    if (!items.length) return '';

    const labels = items.map((r) => truncate(plain(r.label), maxLabel));
    const values = items.map((r) => truncate(plain(r.value), maxValue));
    const labelW = Math.max(...labels.map((l) => width(l)));
    const valueW = Math.max(...values.map((v) => width(v)));

    const out = items.map((_, i) => {
        const label = pad(labels[i], labelW);
        if (style === 'leader') {
            const gap = Math.max(1, labelW - width(label) + 2);
            const dots = '.'.repeat(Math.max(1, Math.min(gap + 1, 14)));
            return `${label} ${dots} ${pad(values[i], valueW, items[i].align)}`;
        }
        return `${label}  ${pad(values[i], valueW, items[i].align)}`;
    });

    // Sin espacios al final de línea: en un bloque de código se ven como
    // Squares invisibles y ensucian el copiado del texto.
    return code(out.map(line => line.replace(/\s+$/, '')).join('\n'));
}

/**
 * Tarjetas de métricas: 2 o 3 columnas con marco, para mostrar números
 * grandes (miembros, uptime, XP) como un tablero y no como una lista.
 *
 * Cada fila de tarjetas se cierra en su propio marco, así que la última fila
 * puede quedar incompleta sin huecos raros.
 *
 * @param {Array<{label: string, value: string, icon?: string}>} cards
 * @param {{perRow?: number|'auto', maxCell?: number}} [opts]
 * @returns {string} bloque de código
 */
function statCards(cards, { perRow = 'auto', maxCell = 18 } = {}) {
    const items = (cards || []).filter(Boolean).slice(0, 6);
    if (!items.length) return '';

    // 'auto' reparte parejo: 1-2 tarjetas van en una fila, 3 en una sola, y a
    // partir de 4filled se usan columnas de a 2 para que no quede una fila
    // huérfana de una sola tarjeta.
    const cols = perRow === 'auto'
        ? (items.length <= 2 ? items.length : (items.length % 2 === 1 ? 3 : 2))
        : perRow;
    const rows = [];
    for (let i = 0; i < items.length; i += cols) rows.push(items.slice(i, i + cols));

    const labelW = Math.max(...items.map(c => width(plain(c.label || ''))));
    const valueW = Math.max(...items.map(c => width(plain(c.value || ''))));
    // Ancho de celda = 1 espacio de aire a cada lado + el contenido más ancho.
    const cellW = Math.max(6, Math.min(maxCell, Math.max(labelW, valueW) + 2));
    const cell = (text) => pad(` ${truncate(plain(text), cellW - 2)} `, cellW);

    const valueOf = c => (c ? (c.icon ? `${c.icon} ${c.value ?? ''}` : (c.value ?? '')) : '');
    const labelOf = c => (c ? (c.label ?? '') : '');

    // Cada fila de tarjetas se cierra en su propio marco: así la última fila
    // puede quedar incompleta (3 tarjetas en columnas de 2) sin dejar huecos
    // raros dentro de la caja.
    const lines = [];
    for (const row of rows) {
        const n = row.length;
        const rule = '─'.repeat(cellW);
        const line = (getter) => `│${row.map(c => cell(getter(c))).join('│')}│`;
        lines.push(`┌${Array.from({ length: n }, () => rule).join('┬')}┐`);
        lines.push(line(valueOf));
        lines.push(line(labelOf));
        lines.push(`└${Array.from({ length: n }, () => rule).join('┴')}┘`);
    }

    return code(lines.join('\n'));
}

// --- Barras y medidores -----------------------------------------------------

const BAR_STYLES = {
    blocks: { on: '█', off: '░' },
    rounded: { on: '▰', off: '▱' },
    line: { on: '━', off: '─' },
    dots: { on: '●', off: '○' },
    bars: { on: '▮', off: '▯' },
};

/**
 * Barra de progreso. Devuelve solo la barra (sin etiquetas) para que puedas
 * componerla como quieras; usá `meter()` si querés el bloque completo.
 * @param {number} value
 * @param {number} max
 * @param {{size?: number, style?: keyof BAR_STYLES}} [opts]
 */
function progressBar(value, max, { size = 14, style = 'blocks' } = {}) {
    const set = BAR_STYLES[style] || BAR_STYLES.blocks;
    const safeMax = max > 0 ? max : 1;
    const ratio = Math.max(0, Math.min(1, value / safeMax));
    // Redondeo con piso en 1 bloque cuando hay progreso: una barra con 0 de 14
    // filled se lee como "vacía" y confunde.
    const filled = ratio > 0 ? Math.max(1, Math.round(ratio * size)) : 0;
    return set.on.repeat(filled) + set.off.repeat(Math.max(0, size - filled));
}

/** Porcentaje entero 0-100, acotado. */
function percent(value, max) {
    if (!max || max <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((value / max) * 100)));
}

/**
 * Medidor con etiqueta, barra y valor: `Nivel  ████████░░░░░░  12/30`
 * Varios medidores se apilan en un único bloque de código alineado.
 * @param {Array<{label: string, value: number, max: number, suffix?: string, style?: string}>} entries
 * @param {{size?: number, bar?: number}} [opts]
 */
function meter(entries, { size = 18, bar = 16 } = {}) {
    const items = (entries || []).filter(Boolean);
    if (!items.length) return '';

    const labelW = Math.max(...items.map(e => width(plain(e.label))));
    const valueW = Math.max(...items.map(e => width(valueText(e))));

    const lines = items.map((e) => {
        const label = pad(truncate(plain(e.label), labelW), labelW);
        const barText = progressBar(e.value, e.max, { size: bar, style: e.style });
        const value = pad(valueText(e), valueW, 'right');
        return `${label} ${barText} ${value}`;
    });

    return code(lines.join('\n'));
}

function valueText(e) {
    const total = `${round(e.value)}/${round(e.max)}`;
    return e.suffix ? `${total} ${e.suffix}` : total;
}

function round(n) {
    if (!Number.isFinite(n)) return 0;
    return Math.abs(n) >= 100 ? Math.round(n) : Math.round(n * 100) / 100;
}

// --- Pastillas, listas y Sparklines ----------------------------------------

/**
 * Pastilla de estado: símbolo + texto (nunca color solo).
 * @param {keyof import('./theme').PILLS} kind
 * @param {string} [text] texto propio; por defecto usa la etiqueta del tema
 */
function pillFromTheme(kind, text) {
    const { PILLS } = require('./theme');
    const p = PILLS[kind];
    if (!p) return text || '';
    return `${p.icon} ${text || p.label}`;
}

/** Lista con viñetas consistentes (Discord no alinea bullets, así que simples). */
function bullets(items, marker = '•') {
    return (items || []).filter(Boolean).map((it) => `${marker} ${it}`).join('\n');
}

/** Lista numerada. */
function numbered(items, start = 1) {
    return (items || []).filter(Boolean).map((it, i) => `${i + start}. ${it}`).join('\n');
}

/**
 * Mini gráfico de líneas con bloques: `▁▂▃▄▅▆▇█`
 * @param {number[]} values
 * @param {{size?: number}} [opts]
 */
function sparkline(values, { size = 24 } = {}) {
    const nums = (values || []).filter(v => Number.isFinite(v));
    if (nums.length < 2) return '';
    const data = nums.slice(-size);
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const ramp = [0x2581, 0x2582, 0x2583, 0x2584, 0x2585, 0x2586, 0x2587, 0x2588];
    return data
        .map(v => String.fromCharCode(ramp[Math.min(ramp.length - 1, Math.floor(((v - min) / range) * (ramp.length - 1)))]))
        .join('');
}

/** Divide un array en trozos de `size`. */
function chunk(arr, size) {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
}

// --- Formateo de números y unidades ----------------------------------------

/** 12345 → "12.3K". Pensado para que entre en una celda de tarjeta. */
function compact(n) {
    const num = Number(n);
    if (!Number.isFinite(num)) return '-';
    const abs = Math.abs(num);
    if (abs >= 1e9) return `${(num / 1e9).toFixed(1).replace(/\.0$/, '')}B`;
    if (abs >= 1e6) return `${(num / 1e6).toFixed(1).replace(/\.0$/, '')}M`;
    if (abs >= 1e4) return `${(num / 1e3).toFixed(1).replace(/\.0$/, '')}K`;
    return num.toLocaleString('es-AR');
}

/** Bytes → "1.4 MB". */
function bytes(n) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let value = Number(n);
    if (!Number.isFinite(value) || value < 0) return '-';
    let i = 0;
    while (value >= 1024 && i < units.length - 1) {
        value /= 1024;
        i++;
    }
    return `${value.toFixed(value >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
}

/** Milisegundos → "1h 04m 09s" / "4.2s" / "820ms". */
function duration(ms) {
    const total = Math.max(0, Math.floor(Number(ms) || 0));
    if (total < 1000) return `${total}ms`;
    const s = Math.floor(total / 1000);
    if (s < 60) return `${(total / 1000).toFixed(1)}s`;
    const m = Math.floor(s / 60);
    const sec = s % 60;
    if (m < 60) return `${m}m ${String(sec).padStart(2, '0')}s`;
    const h = Math.floor(m / 60);
    return `${h}h ${String(m % 60).padStart(2, '0')}m ${String(sec).padStart(2, '0')}s`;
}

/**
 * Plural simple.
 *   pluralize(1, 'vez', 'veces')  → "1 vez"
 *   pluralize(3, 'vez', 'veces')  → "3 veces"
 *   pluralize(2, 'canal')         → "2 canals"   (agrega la s)
 * OJO: sin el plural explícito, "vez" + s = "vezs", que está mal. Las palabras
 * que ya terminan en s o z (vez, luz) necesitan el plural dado.
 */
function pluralize(count, singular, plural) {
    const resolved = plural || `${singular}s`;
    return `${count} ${Math.abs(count) === 1 ? singular : resolved}`;
}

/** Une una lista en texto natural: "a, b y c". */
function joinAnd(items, conjunction = 'y') {
    const list = (items || []).filter(Boolean).map(String);
    if (list.length === 0) return '';
    if (list.length === 1) return list[0];
    return `${list.slice(0, -1).join(', ')} ${conjunction} ${list.at(-1)}`;
}

/** Corta una URL para mostrar sin romper el panel (con el protocolo incluido). */
function shortUrl(url, max = 40) {
    const str = String(url || '');
    if (str.length <= max) return str;
    return `${str.slice(0, max - 1)}…`;
}

module.exports = {
    // medición / recorte
    width, plain, plainText, pad, padStart, padEnd, truncate, truncateVisible,
    escapeMd, code, compact, bytes, duration, pluralize, joinAnd, shortUrl, chunk,
    // composición
    dataGrid, statCards, progressBar, meter, percent, pillFromTheme, bullets,
    numbered, sparkline, BAR_STYLES,
};
