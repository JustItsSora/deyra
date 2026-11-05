// src/lib/ui/imagePanel.js
//
// El panel de imágenes/GIFs. Es el tipo de respuesta más repetida del bot
// (redes sociales, animales, fotos de perfil, memes), así que tiene su propio
// constructor: siempre igual de lindo, con la imagen arriba, el texto en el
// medio y los créditos de la fuente abajo.
//
// Lo que suma frente a "mandar la imagen suelta":
//   · El texto y el GIF no compiten: título → descripción → media → créditos.
//   · Atribución de la fuente y del autor cuando la API los da.
//   · Spoiler por comando (para contenido que sorprenda en un canal compartido).
//   · Conteo de páginas integrado, para reusar createPaginationSession sin
//     volver a escribir el "-# 3/10" a mano en cada comando.

const { MessageFlags } = require('discord.js');
const { payload } = require('./panel');
const text = require('./text');

/**
 * @param {object} opts
 * @param {string} [opts.title]      Título del panel.
 * @param {string} [opts.icon]       Emoji adelante del título.
 * @param {string} [opts.caption]    Texto principal (markdown).
 * @param {string} [opts.kicker]
 * @param {string} [opts.category]   Define el acento.
 * @param {string} [opts.tone]
 * @param {string} [opts.url]        Una imagen.
 * @param {string[]} [opts.urls]     Varias (galería, se parte de a 10).
 * @param {{url: string, description?: string, spoiler?: boolean}|Array} [opts.media]
 * @param {string} [opts.source]     Nombre de la API/source (crédito).
 * @param {string} [opts.sourceUrl]  Enlace a la fuente o al post original.
 * @param {string} [opts.author]     Autor/creador del contenido, si existe.
 * @param {string} [opts.spoiler]    "true" para marcar la imagen como spoiler.
 * @param {{page: number, total: number}|null} [opts.pagination]
 * @param {string} [opts.footerText]
 * @param {boolean} [opts.brand]
 * @param {import('discord.js').ActionRowBuilder[]} [opts.rows] Botones (paginación).
 */
function imagePanel(opts = {}) {
    const {
        title, icon, caption, kicker, category, tone,
        url, urls, media, source, sourceUrl, author, spoiler,
        pagination, footerText, brand = true, rows = [],
    } = opts;

    // Normaliza las tres formas de pasar la imagen a una sola lista.
    let mediaItems = [];
    if (media) mediaItems = Array.isArray(media) ? media : [media];
    else if (urls) mediaItems = urls.map(u => (typeof u === 'string' ? { url: u } : u));
    else if (url) mediaItems = [{ url }];
    mediaItems = mediaItems.filter(m => m && m.url);

    // Créditos: fuente, autor y enlace, sin repetir la URL si es larga.
    const credits = [];
    if (source) credits.push(`Fuente: **${source}**`);
    if (author) credits.push(`Autor: ${author}`);
    if (sourceUrl) credits.push(`[Enlace](${sourceUrl})`);
    if (pagination) {
        credits.push(`Página **${pagination.page}/${pagination.total}**`);
    }
    const autoCredits = credits.length ? `-# ${credits.join(' · ')}` : null;

    return payload({
        category,
        tone,
        kicker,
        title,
        icon,
        description: caption,
        media: mediaItems.length
            ? mediaItems.map(m => ({
                url: m.url,
                description: spoiler === 'true' || spoiler === true ? undefined : m.description,
                spoiler: spoiler === 'true' || spoiler === true ? true : m.spoiler,
            }))
            : undefined,
        footerText: [autoCredits, footerText].filter(Boolean).join('\n') || undefined,
        brand,
        rows,
    });
}

/** Atajo: devuelve el payload de imagen con los flags correctos. */
function imagePayload(opts = {}) {
    return { ...imagePanel(opts), flags: MessageFlags.IsComponentsV2 };
}

module.exports = { imagePanel, imagePayload };
