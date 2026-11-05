// src/lib/ui/panel.js
//
// Constructor de paneles. Este es el corazón del rediseño: una única función
// que recibe el contenido de un comando en forma declarativa y devuelve el
// ContainerBuilder con la jerarquía, los colores, los cortes de sección y el
// pie de marca ya resueltos.
//
// Un comando nuevo se escribe así y queda bien sin tocar una línea de estilo:
//
//   panel({ category: 'utilidad', title: 'Clima en Rosario', icon: '🌤️',
//           grid: [['Condición', 'Despejado'], ['Temp', '21 °C']] })
//
// Reglas que aplica solo, para que ningún panel se rompa ni se vea desparejo:
//   · Acento = tono explícito > categoría > color de marca.
//   · Encabezado: kicker (contexto) → título → subtítulo.
//   · Separadores SOLO entre bloques de contenido, nunca al principio ni al final.
//   · Recorta cualquier texto al límite real de Discord de cada componente.
//   · Agrega el pie de marca salvo que se pida lo contrario.
//   · Si el panel pasa los 10 hijos que admite un Container, lo parte en varios
//     Containers en vez de fallar con "must have at most 10 children".

const {
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize,
    SectionBuilder, ThumbnailBuilder, ButtonBuilder, MessageFlags,
} = require('discord.js');
const theme = require('./theme');
const text = require('./text');
const sanitize = require('./sanitize');
const { BRAND, TYPE } = theme;

// Límites reales de Discord (Components V2). Si se superan, la API rechaza el
// mensaje; preferimos recortar o partir el panel.
const LIMITS = {
    textDisplay: 4000,
    containerChildren: 10,
    topLevelComponents: 40,
    galleryItems: 10,
    actionRowButtons: 5,
};

const SEP = (divider = true) => new SeparatorBuilder()
    .setSpacing(SeparatorSpacingSize.Small)
    .setDivider(divider);

const td = (content) => new TextDisplayBuilder().setContent(content);

// --- Bloques de contenido ---------------------------------------------------

/**
 * Grilla de datos (dos columnas alineadas) → bloque de código monoespaciado.
 * @param {Array} rows
 * @param {object} [opts] ver text.dataGrid
 */
function gridBlock(rows, opts = {}) {
    const rendered = text.dataGrid(rows, opts);
    return rendered ? [td(sanitize.clip(rendered, LIMITS.textDisplay))] : [];
}

/**
 * Tarjetas de métricas (2-3 columnas con marco).
 * @param {Array<{label: string, value: string, icon?: string}>} cards
 */
function statsBlock(cards, opts = {}) {
    const rendered = text.statCards(cards, opts);
    return rendered ? [td(sanitize.clip(rendered, LIMITS.textDisplay))] : [];
}

/** Medidor(es) con barra de progreso. */
function meterBlock(entries, opts = {}) {
    const rendered = text.meter(entries, opts);
    return rendered ? [td(sanitize.clip(rendered, LIMITS.textDisplay))] : [];
}

/**
 * Imagen o GIF. `items` acepta:
 *   'https://…'                              → una imagen
 *   ['https://…', 'https://…']               → galería (se parte en bloques de 10)
 *   { url, description, spoiler, height }    → una imagen con pie y spoiler
 * @param {string|string[]|object|object[]} items
 */
function mediaBlock(items, { spoiler = false } = {}) {
    if (!items) return [];
    // El filtro de URLs vive en sanitize: es la regla de seguridad del bot y
    // no debería estar duplicada en cada comando.
    const normalized = sanitize.filterMedia(items);
    if (!normalized.length) return [];

    const { MediaGalleryBuilder, MediaGalleryItemBuilder } = require('discord.js');
    const out = [];

    for (let i = 0; i < normalized.length; i += LIMITS.galleryItems) {
        const chunk = normalized.slice(i, i + LIMITS.galleryItems);
        const gallery = new MediaGalleryBuilder();
        for (const item of chunk) {
            const entry = new MediaGalleryItemBuilder().setURL(item.url);
            if (item.description) entry.setDescription(text.truncate(String(item.description), 300));
            if (item.spoiler || spoiler) entry.setSpoiler(true);
            gallery.addItems(entry);
        }
        out.push(gallery);
    }

    // Los pies de imagen no puede contenerlos MediaGallery: van como texto debajo.
    for (const item of normalized) {
        if (item.description) out.push(td(`-# ${text.truncate(item.description, 200)}`));
    }

    return out;
}

/**
 * Aviso destacado con marcador (spoilers, advertencias, tips).
 * @param {{tone?: 'primary'|'success'|'error'|'warning'|'info'|'muted', text: string}} callout
 */
function calloutBlock({ tone = 'muted', text: body }) {
    const marks = { primary: '◆', success: '✔', error: '✖', warning: '⚠', info: 'ℹ', muted: '·' };
    return [td(sanitize.clip(`> ${marks[tone] || '·'} ${text.truncate(body, 1500)}`, LIMITS.textDisplay))];
}

/** Lista con viñetas, opcionalmente con encabezado. */
function listBlock({ title, items, marker = '•', ordered = false, limit = 12 }) {
    const clean = (items || []).filter(Boolean).slice(0, limit);
    if (!clean.length) return [];
    // Cada ítem se sanea por separado: uno con @everyone no debe arrastrar al
    // resto, y el corte de longitud tiene que contar bien.
    const safe = clean.map(item => sanitize.neutralizeMentions(String(item)));
    const body = ordered ? text.numbered(safe) : text.bullets(safe, marker);
    return title
        ? [td(sanitize.clip(`**${title}**`, LIMITS.textDisplay)), td(sanitize.clip(body, LIMITS.textDisplay))]
        : [td(sanitize.clip(body, LIMITS.textDisplay))];
}

/** Cita (blockquote) con autor opcional. */
function quoteBlock({ text: body, author, footer }) {
    const safe = sanitize.neutralizeMentions(String(body));
    const lines = [`> ${safe.split('\n').join('\n> ')}`];
    if (author) lines.push(`> — **${author}**`);
    if (footer) lines.push(`> -# ${footer}`);
    return [td(sanitize.clip(lines.join('\n'), LIMITS.textDisplay))];
}

/** Bloque de texto libre con el estilo de la escala tipográfica. */
function proseBlock(content, level = 'body') {
    if (!content) return [];
    const marker = TYPE[level] ?? '';
    const body = marker && !String(content).startsWith(marker) ? `${marker} ${content}` : content;
    // truncateVisible + clip: la primera mide por ancho visible (para que un
    // emoji no cuente como medio carácter), la segunda cierra el markdown.
    return [td(sanitize.clip(text.truncateVisible(body, LIMITS.textDisplay - 8), LIMITS.textDisplay))];
}

// --- Construcción del panel -------------------------------------------------

/**
 * @typedef {object} PanelOptions
 * @property {string}  [title]      Título principal (sin el `#`).
 * @property {string}  [icon]       Emoji/símbolo adelante del título.
 * @property {string}  [kicker]    Línea de contexto arriba del título.
 * @property {string}  [subtitle]   Texto de apoyo bajo el título.
 * @property {string}  [description] Párrafo principal (markdown).
 * @property {string}  [tone]      'primary'|'success'|'error'|'warning'|'neutral'|'info'|'muted'
 * @property {string}  [category]  Categoría del comando (define el acento).
 * @property {number}  [accent]    Color entero explícito: pisa el tono y la categoría.
 * @property {string[]} [fields]   Líneas markdown sueltas (estilo viejo, sigue soportado).
 * @property {Array}   [grid]      Grilla de datos → text.dataGrid
 * @property {Array}   [stats]     Tarjetas de métricas → text.statCards
 * @property {Array}   [meters]    Medidores con barra → text.meter
 * @property {string|string[]|object|object[]} [media] Imagen/GIF/galería
 * @property {boolean} [spoiler]   Marcar el media como spoiler.
 * @property {Array<{tone?: string, text: string}>} [callouts] Avisos destacados.
 * @property {Array<{title?: string, items: string[], marker?: string, ordered?: boolean}>} [lists]
 * @property {{text: string, author?: string, footer?: string}} [quote]
 * @property {string}  [footerText] Línea de créditos propia (además de la marca).
 * @property {boolean} [brand]     Poner el pie de marca (default true).
 * @property {boolean} [spoilerAll] Envolver todo el contenido en spoiler.
 * @property {import('discord.js').ActionRowBuilder[]} [rows] Filas de botones.
 * @property {import('discord.js').SectionBuilder[]} [sections]
 */

/**
 * Arma el panel completo.
 * @param {PanelOptions} opts
 * @returns {ContainerBuilder[]}
 */
function build(opts = {}) {
    const { tone, category, spoilerAll = false, accent } = opts;
    return chunkContainers(collect(opts), resolveAccent(accent, tone, category), spoilerAll);
}

/**
 * Color de acento del panel. `accent` (un entero explícito) gana sobre todo lo
 * demás: es lo que permite que /embed respete el color que pidió el usuario.
 */
function resolveAccent(accent, tone, category) {
    if (Number.isInteger(accent)) return accent;
    return theme.accentFor({ tone, category });
}

/**
 * Reúne los componentes del panel en orden, aplicando el ritmo de la
 * composición (encabezado → bloques separados → botones → pie) SIN decisions
 * de formato. Es lo que comparten `build()` y `buildOne()`.
 * @param {PanelOptions} opts
 * @returns {import('discord.js').JSONEncodable<any>[]}
 */
function collect(opts = {}) {
    const {
        title, icon, kicker, subtitle, description, fields,
        grid, stats, meters, media, spoiler, callouts, lists, quote,
        footerText, brand = true, rows = [], sections = [], category,
    } = opts;

    const children = [];
    let needsSeparator = false;

    const addBlock = (blocks) => {
        if (!blocks || !blocks.length) return;
        if (needsSeparator) {
            children.push(SEP(true));
            needsSeparator = false;
        }
        children.push(...blocks);
        needsSeparator = true;
    };

    // --- Encabezado ---
    const head = [];
    const kickerText = theme.kickerFor({ category, eyebrow: kicker });
    if (kickerText) head.push(td(`${TYPE.eyebrow} ${text.truncate(kickerText, 80)}`));
    if (title) {
        const heading = icon ? `${icon} ${title}` : title;
        head.push(td(`${TYPE.display} ${text.truncate(heading, 120)}`));
    } else if (!kickerText) {
        // Sin kicker ni título no hay encabezado: se arranca con contenido.
        head.length = 0;
    }
    if (head.length) {
        children.push(...head);
        needsSeparator = true;
    }
    if (subtitle) addBlock(proseBlock(sanitize.neutralizeMentions(subtitle), 'body'));

    // --- Contenido ---
    if (description) addBlock(proseBlock(sanitize.neutralizeMentions(description), 'body'));
    if (fields && fields.length) {
        addBlock(fields.filter(Boolean).flatMap(f => proseBlock(sanitize.neutralizeMentions(f), 'body')));
    }
    if (grid && grid.length) addBlock(gridBlock(grid, opts.gridOptions));
    if (stats && stats.length) addBlock(statsBlock(stats, opts.statsOptions));
    if (meters && meters.length) addBlock(meterBlock(meters, opts.meterOptions));
    for (const callout of callouts || []) {
        addBlock(calloutBlock({
            tone: callout?.tone || 'muted',
            // Neutraliza @everyone: los avisos que vienen de una API no tienen
            // por qué poder mencionar a todo el servidor.
            text: sanitize.neutralizeMentions(callout?.text || ''),
        }));
    }
    for (const list of lists || []) addBlock(listBlock(list));
    if (quote) addBlock(quoteBlock(quote));
    if (media) addBlock(mediaBlock(sanitize.filterMedia(media), { spoiler }));
    for (const raw of sections) {
        // Acepta tanto un SectionBuilder como un objeto { text, accessory }:
        // el objeto es más cómodo y evita que cada comando tenga que Requiring
        // el SectionBuilder a mano.
        const builder = raw instanceof SectionBuilder ? raw : section(raw);
        if (needsSeparator) children.push(SEP(true));
        children.push(builder);
        needsSeparator = true;
    }

    // --- Filas de botones ---
    for (const row of rows) {
        if (!row) continue;
        if (needsSeparator) {
            children.push(SEP(false));
            needsSeparator = false;
        }
        children.push(row);
    }

    // --- Pie ---
    const foot = [];
    if (footerText) foot.push(`-# ${text.truncate(sanitize.neutralizeMentions(footerText), 250)}`);
    if (brand && BRAND.signature) foot.push(`-# ${BRAND.signature}`);
    if (foot.length) {
        if (needsSeparator) children.push(SEP(false));
        children.push(td(foot.join('\n')));
    }

    return children;
}

/**
 * Igual que `build()` pero devuelve un ÚNICO ContainerBuilder (quepa o no).
 * Es lo que necesita el puente de compatibilidad `src/lib/panel.js`, donde los
 * comandos existentes hacen `components: [panel]`.
 *
 * @param {PanelOptions} opts
 * @returns {ContainerBuilder}
 */
function buildOne(opts = {}) {
    const { tone, category, spoilerAll = false, accent } = opts;
    return fitSingle(collect(opts), resolveAccent(accent, tone, category), spoilerAll);
}

/**
 * Parte una lista de componentes en Containers válidos (máx. 10 hijos cada uno)
 * y aplica el color de acento. Devuelve SIEMPRE un array con al menos un
 * elemento para que el llamador pueda hacer `[0]`.
 */
function chunkContainers(children, accent, spoilerAll) {
    const out = [];
    for (let i = 0; i < children.length; i += LIMITS.containerChildren) {
        const slice = children.slice(i, i + LIMITS.containerChildren);
        if (!slice.length) break;
        const container = new ContainerBuilder().setAccentColor(accent);
        if (spoilerAll) container.setSpoiler(true);
        container.spliceComponents(0, 0, ...slice);
        out.push(container);
    }

    if (!out.length) {
        const empty = new ContainerBuilder().setAccentColor(accent);
        if (spoilerAll) empty.setSpoiler(true);
        empty.addTextDisplayComponents(td('-# (sin contenido)'));
        out.push(empty);
    }

    return out.slice(0, LIMITS.topLevelComponents);
}

const isText = (c) => c instanceof TextDisplayBuilder;
const isSeparator = (c) => c instanceof SeparatorBuilder;

/** Combina dos TextDisplay en uno, respetando el límite de 4000 caracteres. */
function mergeText(a, b) {
    const joined = `${a.data.content}\n${b.data.content}`;
    if (joined.length <= LIMITS.textDisplay) return td(joined);
    // No entran juntos: recortamos el segundo para que entre.
    const room = LIMITS.textDisplay - a.data.content.length - 1;
    return td(`${a.data.content}\n${b.data.content.slice(0, Math.max(0, room - 1))}…`);
}

/**
 * Fuerza una lista de componentes a entrar en UN solo Container, degradando la
 * decoración antes que el contenido. Necesario para el puente de compatibilidad
 * (`src/lib/panel.js#buildPanel`), donde ~40 llamadas existentes hacen
 * `components: [panel]` y no pueden recibir un array.
 *
 * Orden de sacrificio: 1) fusionar textos contiguos, 2) quitar separadores con
 * divider, 3) quitar separadores simples, 4) fusionar el par de textos más
 * cercano hasta entrar. Nunca se descarta contenido.
 *
 * @returns {ContainerBuilder}
 */
function fitSingle(children, accent, spoilerAll) {
    let list = children.slice();

    // 1. Fusionar TextDisplay contiguos (no cambia nada visualmente: un bloque
    //    de texto con dos párrafos se ve igual que dos bloques seguidos).
    for (let i = list.length - 2; i >= 0; i--) {
        if (isText(list[i]) && isText(list[i + 1])) {
            list.splice(i, 2, mergeText(list[i], list[i + 1]));
        }
    }

    const limit = LIMITS.containerChildren;

    // 2 y 3. Sacar separadores: primero los que tienen línea, después los finos.
    for (const divider of [true, false]) {
        for (let i = list.length - 1; i >= 0 && list.length > limit; i--) {
            if (isSeparator(list[i]) && list[i].data.divider === divider) list.splice(i, 1);
        }
    }

    // 4. Fusionar los dos textos más cercanos hasta que entre.
    while (list.length > limit) {
        let best = -1;
        let bestGap = Infinity;
        for (let i = 0; i < list.length - 1; i++) {
            if (!isText(list[i]) || !isText(list[i + 1])) continue;
            const gap = i + 1;
            if (gap < bestGap) { bestGap = gap; best = i; }
        }
        if (best === -1) {
            // Solo quedan componentes no fusionables (galerías, botones, secciones):
            // en ese caso el contenido no entra, así que recortamos desde abajo
            // preservando el encabezado.
            console.warn('[ui] Panel con demasiados componentes no fusionables; se recortó al máximo permitido.');
            list = list.slice(0, limit);
            break;
        }
        list.splice(best, 2, mergeText(list[best], list[best + 1]));
    }

    const container = new ContainerBuilder().setAccentColor(accent);
    if (spoilerAll) container.setSpoiler(true);
    if (!list.length) list = [td('-# (sin contenido)')];
    container.spliceComponents(0, 0, ...list);
    return container;
}

/**
 * Atajo: panel + flags de Components V2, listo para `reply()`.
 * @param {PanelOptions} opts
 */
function payload(opts = {}) {
    return {
        components: build(opts),
        flags: MessageFlags.IsComponentsV2,
    };
}

/**
 * Igual que payload() pero además marca el mensaje como efímero (visible solo
 * para quien invocó el comando).
 */
function privatePayload(opts = {}) {
    return {
        ...payload(opts),
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    };
}

/**
 * Construye un `SectionBuilder` con un accesorio (botón o miniatura), que es la
 * forma de diagramar "texto a la izquierda, control a la derecha" sin que el
 * botón ocupe una fila entera.
 *
 * @param {{text: string|string[], accessory: import('discord.js').ButtonBuilder|{url?: string, attachment?: string, description?: string, spoiler?: boolean}}} opts
 */
function section({ text: content, accessory }) {
    const sectionBuilder = new SectionBuilder();
    const lines = Array.isArray(content) ? content : [content];
    sectionBuilder.addTextDisplayComponents(...lines.filter(Boolean).map(l => td(l)));
    if (accessory) {
        // El accesorio es exactamente UNA pieza: o un botón, o una miniatura.
        // Ojo: en esta versión de discord.js el atajo de objeto plano para la
        // miniatura no funciona, hay que pasar sí o sí un ThumbnailBuilder.
        const url = accessory.url || accessory.attachment;
        if (url && !(accessory instanceof ButtonBuilder)) {
            const thumb = new ThumbnailBuilder().setURL(url);
            if (accessory.description) thumb.setDescription(text.truncate(String(accessory.description), 300));
            if (accessory.spoiler) thumb.setSpoiler(true);
            sectionBuilder.setThumbnailAccessory(thumb);
        } else {
            sectionBuilder.setButtonAccessory(accessory);
        }
    }
    return sectionBuilder;
}

module.exports = {
    build, buildOne, payload, privatePayload, section, chunkContainers, fitSingle,
    collect, LIMITS,
    // bloques reutilizables por si un comando los necesita sueltos
    gridBlock, statsBlock, meterBlock, mediaBlock, calloutBlock, listBlock,
    quoteBlock, proseBlock, SEP, td,
};
