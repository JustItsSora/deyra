// src/lib/api/memeApi.js
// Fuentes de memes e imágenes graciosas, todas sin API key.
//
//   imgflip  → catálogo de plantillas con sus cajas de texto (el mejor para
//              /memegen: podés elegir la plantilla y escribir arriba/abajo)
//   xkcd     → tira oficial, con el texto original en inglés
//   cataas   → gatos con texto encima (se accede por URL, no por API)
//
// Nota: cataas no tiene endpoint JSON para "gato con texto"; se genera la URL
// directamente. Es su forma oficial de hacerlo.

const http = require('../http');
const { withFallback } = require('../providers');

const IMGFLIP_CACHE = 12 * 60 * 60 * 1000; // 12 h: las plantillas no cambian
const XKCD_CACHE = 60 * 60 * 1000;

/** Plantillas de imgflip, de la más reciente a la más clásica. */
async function listTemplates({ limit = 100 } = {}) {
    const { value } = await withFallback([{
        name: 'imgflip',
        run: async () => {
            const data = await http.getJson('https://api.imgflip.com/get_memes', {
                provider: 'imgflip', ttl: IMGFLIP_CACHE, timeout: 10000,
            });
            if (!data?.success) throw new Error('imgflip respondió success:false');
            return data.data.memes;
        },
    }], { label: 'meme:plantillas' });

    return value.slice(0, limit).map(m => ({
        id: m.id,
        name: m.name,
        url: m.url,
        width: m.width,
        height: m.height,
        boxes: m.box_count,
    }));
}

/** Una plantilla al azar (para /memegen sin argumentos). */
async function randomTemplate() {
    const memes = await listTemplates({ limit: 100 });
    if (!memes.length) throw new Error('imgflip: sin plantillas');
    return memes[Math.floor(Math.random() * memes.length)];
}

/** Plantilla por id (para el menú de /memegen). */
async function templateById(id) {
    const memes = await listTemplates({ limit: 400 });
    return memes.find(m => String(m.id) === String(id)) || null;
}

/**
 * Construye la URL de un meme con texto.
 * @param {{name: string, id: string, boxes: number}} template
 * @param {string} top Texto de arriba.
 * @param {string} bottom Texto de abajo.
 */
function buildMemeUrl(template, top = '', bottom = '') {
    const params = new URLSearchParams({ font: 'impact' });
    if (template.boxes >= 1 && top) params.set('boxes[0].text', top);
    if (template.boxes >= 2 && bottom) params.set('boxes[1].text', bottom);
    return `${template.url}?${params.toString()}`;
}

/** Tira de xkcd por número (o la última si no se pasa). */
async function xkcd(num) {
    const { value } = await withFallback([{
        name: 'xkcd',
        run: async () => {
            // OJO con la URL: la forma correcta es /<num>/info.0.json.
            // /<num>.0.json y /<num>.json devuelven 404 (es contra-intuitivo y
            // por eso queda anotado acá).
            const url = num ? `https://xkcd.com/${num}/info.0.json` : 'https://xkcd.com/info.0.json';
            const data = await http.getJson(url, { provider: 'xkcd', ttl: XKCD_CACHE, timeout: 10000 });
            if (!data?.img) throw new Error('xkcd: sin imagen');
            return data;
        },
    }], { label: 'meme:xkcd' });
    return value;
}

/**
 * URL de un gato con texto (cataas).
 * @param {string} [text]
 * @param {{type?: 'square'|'fit'|'small', color?: string}} [opts]
 */
function catWithText(text, { type = 'square', color } = {}) {
    const params = new URLSearchParams({ type });
    if (text) params.set('text', text);
    if (color) params.set('color', color);
    return `https://cataas.com/cat?${params.toString()}`;
}

/** Gato al azar. */
function randomCat() {
    return 'https://cataas.com/cat';
}

module.exports = { listTemplates, randomTemplate, templateById, buildMemeUrl, xkcd, catWithText, randomCat };
