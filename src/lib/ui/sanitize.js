// src/lib/ui/sanitize.js
// Saneado de texto y URLs que llegan de afuera.
//
// La mayor parte del contenido del bot viene de APIs de terceros: lo que
// devuelve un servicio puede incluir un `<script>`, un `javascript:` en una URL
// de imagen, 4000 caracteres de una vez, o un emoji que rompe el cálculo de
// ancho de la grilla.
//
// Discord no ejecuta JavaScript, así que un `<script>` no corre: el riesgo real
// es otro. Con texto no saneado, un `<@everyone>` pegado desde una API hace que
// el bot mencione a todo el servidor (allowedMentions lo evita, pero el texto
// sigue viéndose feo), y una URL rara deja el panel con un hueco vacío sin
// explicación.
//
// Reglas:
//   · Las menciones masivas se rompen putting un cero-width: el usuario ve el
//     texto literal y no se dispara la notificación.
//   · El markdown se equilibra para no dejar un ** o un ` sin cerrar.
//   · Las URLs de media solo pueden ser http(s).

const ZERO_WIDTH = '\u200b';

/** Rompe las menciones masivas para que no se activen. */
function neutralizeMentions(str) {
    return String(str ?? '')
        .replace(/@(everyone|here)\b/gi, `@$1${ZERO_WIDTH}`)
        .replace(/<@!?(\d{15,25})>/g, `<@$1>`); // menciones de usuario: se mantienen
}

/**
 * Texto listo para un panel: sin menciones masivas y con el markdown
 * balanceado.
 * @param {string} str
 * @param {{escape?: boolean}} [opts] escape=true también escapa el markdown
 */
function sanitize(str, { escape = false } = {}) {
    let out = neutralizeMentions(str);
    if (escape) {
        out = out.replace(/([\\*_~`>|])/g, '\\$1');
    } else {
        out = balanceMarkdown(out);
    }
    return out;
}

/** Cierra los pares de ** y ` que quedaron abiertos al recortar. */
function balanceMarkdown(str) {
    const bold = (str.match(/\*\*/g) || []).length;
    const code = (str.match(/`/g) || []).length;
    return str + (bold % 2 ? '**' : '') + (code % 2 ? '`' : '');
}

/** true si la URL es una imagen que Discord va a poder mostrar. */
function isSafeMediaUrl(url) {
    if (typeof url !== 'string' || !url) return false;
    // data: y javascript: quedan explícitamente afuera. Discord no los renderiza
    // igual, así que solo producirían un panel con un hueco.
    return /^https?:\/\//i.test(url.trim());
}

/** Filtra una lista de medios dejando solo las URLs válidas. */
function filterMedia(items) {
    return (Array.isArray(items) ? items : [items])
        .map((item) => (typeof item === 'string' ? { url: item } : item))
        .filter((item) => item && isSafeMediaUrl(item.url));
}

/**
 * Recorta a `max` caracteres respetando el límite de Discord, dejando el
 * markdown cerrado. Es la versión "segura" de text.truncate.
 * @param {string} str
 * @param {number} max
 */
function clip(str, max = 4000) {
    let out = String(str ?? '');
    if (out.length <= max) return out;

    // Hay que reservar espacio para el sufijo de cierre (+ "**" o "`").
    let suffix = '…';
    const boldOpen = ((out.slice(0, max).match(/\*\*/g) || []).length) % 2;
    const codeOpen = ((out.slice(0, max).match(/`/g) || []).length) % 2;
    if (boldOpen) suffix += '**';
    if (codeOpen) suffix += '`';

    const room = Math.max(0, max - suffix.length);
    const slice = out.slice(0, room);

    // Preferimos cortar en un salto de línea o en un espacio.
    const lastBreak = Math.max(slice.lastIndexOf('\n'), slice.lastIndexOf(' '));
    const body = lastBreak > room * 0.5 ? slice.slice(0, lastBreak) : slice;

    return body.replace(/\s+$/, '') + suffix;
}

module.exports = {
    sanitize, neutralizeMentions, balanceMarkdown,
    isSafeMediaUrl, filterMedia, clip, ZERO_WIDTH,
};
