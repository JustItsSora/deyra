// src/lib/api/avatarApi.js
// Generadores de avatar e imagen por seed (DiceBear), sin API key.
//
// DiceBear devuelve SVG. Discord NO muestra SVG en un MediaGallery: hay que
// pedir PNG explícitamente. Por eso todo pasa por `?format=png` y se elige el
// tamaño según el uso (512 para avatares, 1024 para imágenes grandes).

const http = require('../http');
const { withFallback } = require('../providers');

const API = 'https://api.dicebear.com/9.x';

/**
 * Estilos disponibles, agrupados. Se usan en el autocompletado de /avatar y en
 * las opciones del slash command (Discord permite máximo 25).
 */
const STYLES = {
    'adventurer': 'Aventura',
    'avataaars': 'Avatar clásico',
    'bottts': 'Bot minimalista',
    'fun-emoji': 'Emoji divertido',
    'lorelei': 'Retrato ilustrado',
    'micah': 'Retrato moderne',
    'miniavs': 'Minimalista',
    'notionists': 'Cuadrositos',
    'open-peeps': 'Personajes abiertos',
    'personas': 'Personas',
    'pixel-art': 'Pixel art',
    'shapes': 'Formas',
    'thumbs': 'Emoticonos',
    'identicon': 'Identicon',
    'big-smile': 'Sonrisa grande',
    'initials': 'Iniciales',
};

/** Estilos que funcionan bien con texto largo. */
const TEXT_SAFE = new Set(['identicon', 'initials', 'shapes', 'pixel-art', 'miniavs', 'notionists']);

function isKnownStyle(style) {
    return Object.hasOwn(STYLES, style);
}

/** Estilos sugeridos para autocomplete. */
function suggestStyles(query = '') {
    const q = String(query).toLowerCase();
    return Object.entries(STYLES)
        .filter(([key, label]) => !q || key.includes(q) || label.toLowerCase().includes(q))
        .slice(0, 25)
        .map(([key, label]) => ({ name: `${key} — ${label}`, value: key }));
}

/**
 * URL de un avatar generado.
 * @param {string} style
 * @param {string} seed Texto que define la imagen.
 * @param {{size?: number, background?: string, radius?: number, fontSize?: number}} [opts]
 */
function avatarUrl(style, seed, { size = 512, background, radius, fontSize } = {}) {
    const styleName = isKnownStyle(style) ? style : 'adventurer';
    const params = new URLSearchParams({
        seed: String(seed || 'deyra').slice(0, 60),
        size: String(size),
    });
    if (background) params.set('backgroundColor', background);
    if (radius !== undefined) params.set('radius', String(radius));
    if (fontSize && TEXT_SAFE.has(styleName)) params.set('fontSize', String(fontSize));
    // OJO: el path es /png, no /svg. Discord no renderiza SVG en los
    // MediaGallery, así que pedir SVG dejaría el panel con un hueco vacío.
    return `${API}/${styleName}/png?${params.toString()}`;
}

/** Avatar con fondo de color, listo para usar de foto de perfil. */
function avatarSquare(style, seed, background = '1e3a5f') {
    return avatarUrl(style, seed, { size: 512, background });
}

/**
 * Verifica que la URL generada responda. Si Dicebear cambia algo, el comando
 * avisa en vez de mandar un 404 roto.
 */
async function verify(url) {
    return withFallback([{
        name: 'dicebear',
        run: async () => {
            const res = await http.request(url, { provider: 'dicebear', timeout: 10000, retries: 1 });
            const type = res.headers.get('content-type') || '';
            if (!type.includes('image')) throw new Error(`dicebear devolvió ${type || 'sin content-type'}`);
            return true;
        },
    }], { label: 'avatar:verify' });
}

module.exports = { STYLES, isKnownStyle, suggestStyles, avatarUrl, avatarSquare, verify, API };
