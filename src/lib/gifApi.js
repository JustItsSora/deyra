// src/lib/gifApi.js
// Capa única de GIFs e imágenes de anime para todo el bot.
//
// Por qué se reescribió (esto era un bug real, no una preference):
//
//   · El código anterior usaba `fetch()` pelado. nekos.best — el proveedor
//     PRINCIPAL — responde 403 "Your request has been blocked for using a
//     missing or invalid User-Agent" a las peticiones sin User-Agent. Todos
//     los comandos sociales (/hug, /kiss, /slap...) estaban caídos en la
//     práctica.
//   · El segundo proveedor, api.waifu.pics, ya no existe: el dominio no
//     resuelve más y waifu.pics fue capturado por un sitio de Casino. Un
//     proveedor que devuelve contenido de otro es peor que uno caído.
//
// Ahora: los pedidos salen por src/lib/http.js (con User-Agent firmado,
// timeout y reintentos) y cada categoría tiene su lista de proveedores de
// respaldo, con circuit breaker para no castigar al usuario cuando uno está
// caído.
//
// Categorías disponibles (nekos.best v2, la lista oficial de su librería):
//   62 GIFs de roleplay + 4 imágenes de personaje (waifu/neko/kitsune/husbando).

const http = require('./http');
const { withFallback } = require('./providers');

/**
 * Categorías de GIF de nekos.best v2.
 * Fuente: constantes oficiales de nekos-best.js (v6.6.0).
 * @type {Record<string, {nekosbest: string, purrbot?: string}>}
 */
const GIF_CATEGORIES = {
    angry: { nekosbest: 'angry', purrbot: 'angry' },
    baka: { nekosbest: 'baka' },
    bite: { nekosbest: 'bite', purrbot: 'bite' },
    bleh: { nekosbest: 'bleh' },
    blowkiss: { nekosbest: 'blowkiss' },
    blush: { nekosbest: 'blush', purrbot: 'blush' },
    bonk: { nekosbest: 'bonk' },
    bored: { nekosbest: 'bored' },
    carry: { nekosbest: 'carry' },
    clap: { nekosbest: 'clap' },
    confused: { nekosbest: 'confused' },
    cry: { nekosbest: 'cry', purrbot: 'cry' },
    cuddle: { nekosbest: 'cuddle', purrbot: 'cuddle' },
    dance: { nekosbest: 'dance', purrbot: 'dance' },
    facepalm: { nekosbest: 'facepalm' },
    feed: { nekosbest: 'feed' },
    handhold: { nekosbest: 'handhold' },
    handshake: { nekosbest: 'handshake' },
    happy: { nekosbest: 'happy' },
    highfive: { nekosbest: 'highfive' },
    hug: { nekosbest: 'hug', purrbot: 'hug' },
    kabedon: { nekosbest: 'kabedon' },
    kick: { nekosbest: 'kick' },
    kiss: { nekosbest: 'kiss', purrbot: 'kiss' },
    lappillow: { nekosbest: 'lappillow' },
    laugh: { nekosbest: 'laugh' },
    lurk: { nekosbest: 'lurk' },
    nod: { nekosbest: 'nod' },
    nom: { nekosbest: 'nom' },
    nope: { nekosbest: 'nope' },
    nya: { nekosbest: 'nya' },
    pat: { nekosbest: 'pat', purrbot: 'pat' },
    peck: { nekosbest: 'peck' },
    poke: { nekosbest: 'poke', purrbot: 'poke' },
    pout: { nekosbest: 'pout', purrbot: 'pout' },
    punch: { nekosbest: 'punch' },
    run: { nekosbest: 'run' },
    salute: { nekosbest: 'salute' },
    shake: { nekosbest: 'shake' },
    shocked: { nekosbest: 'shocked' },
    shoot: { nekosbest: 'shoot' },
    shrug: { nekosbest: 'shrug' },
    sip: { nekosbest: 'sip' },
    slap: { nekosbest: 'slap', purrbot: 'slap' },
    sleep: { nekosbest: 'sleep' },
    smile: { nekosbest: 'smile', purrbot: 'smile' },
    smug: { nekosbest: 'smug' },
    spin: { nekosbest: 'spin' },
    stare: { nekosbest: 'stare' },
    tableflip: { nekosbest: 'tableflip' },
    teehee: { nekosbest: 'teehee' },
    think: { nekosbest: 'think' },
    thumbsup: { nekosbest: 'thumbsup' },
    tickle: { nekosbest: 'tickle', purrbot: 'tickle' },
    wag: { nekosbest: 'wag' },
    wave: { nekosbest: 'wave' },
    wink: { nekosbest: 'wink' },
    yawn: { nekosbest: 'yawn' },
    yeet: { nekosbest: 'yeet' },
};

// Categorías extra que solo existen en purrbot (útil como respaldo y como
// contenido propio de "gatitos").
const EXTRA_CATEGORIES = {
    comfy: { purrbot: 'comfy' },
    fluff: { purrbot: 'fluff' },
    lay: { purrbot: 'lay' },
    lick: { purrbot: 'lick' },
    tail: { purrbot: 'tail' },
    icon: { purrbot: 'icon' },
};

/** Imágenes de personaje (no GIF) de nekos.best v2. */
const CHARACTER_CATEGORIES = {
    waifu: { nekosbest: 'waifu', purrbot: 'neko' },
    neko: { nekosbest: 'neko', purrbot: 'neko' },
    kitsune: { nekosbest: 'kitsune', purrbot: 'kitsune' },
    husbando: { nekosbest: 'husbando' },
    shiro: { purrbot: 'shiro' },
    senko: { purrbot: 'senko' },
    okami: { purrbot: 'okami' },
    holo: { purrbot: 'holo' },
};

const ALL_CATEGORIES = { ...GIF_CATEGORIES, ...EXTRA_CATEGORIES };

// Sinónimos en español/inglés para que `/gif abrazos` y `/gif hola` encuentren
// algo. Sin esto, escribir "abrazos" no devolvería nada.
const ALIASES = {
    abrazo: 'hug', abrazos: 'hug', abrazar: 'hug', hug: 'hug', abrazo_de: 'hug',
    beso: 'kiss', besos: 'kiss', besar: 'kiss', kiss: 'kiss',
    mimo: 'blowkiss', mimos: 'blowkiss', soplar: 'blowkiss', beso_al_aire: 'blowkiss',
    caricia: 'pat', acariciar: 'pat', mimos2: 'pat', chulito: 'pat', headpat: 'pat',
    acurrucar: 'cuddle', acurruco: 'cuddle', cuddle: 'cuddle',
    cosquillas: 'tickle', tickle: 'tickle',
    picar: 'poke', picazo: 'poke', poke: 'poke',
    morder: 'bite', mordisco: 'bite', bite: 'bite',
    cachetada: 'slap', bofetada: 'slap', slap: 'slap',
    puñetazo: 'punch', golpe: 'punch', punch: 'punch',
    chocar: 'highfive', chocars: 'highfive', highfive: 'highfive',
    mano: 'handhold', manitos: 'handhold', handhold: 'handhold',
    saludar: 'wave', saludo: 'wave', hola: 'wave', wave: 'wave',
    guiñar: 'wink', guiño: 'wink', wink: 'wink',
    sonreir: 'smile', sonrisa: 'smile', smile: 'smile',
    rubor: 'blush', sonrojar: 'blush', blush: 'blush',
    llorar: 'cry', llanto: 'cry', cry: 'cry',
    bailar: 'dance', baile: 'dance', dance: 'dance',
    feliz: 'happy', alegria: 'happy', happy: 'happy',
    reir: 'laugh', risa: 'laugh', laugh: 'laugh',
    enfadado: 'pout', enojo: 'pout', enfado: 'angry', enfadarse: 'angry', angry: 'angry',
    presumir: 'smug', smug: 'smug',
    mirar: 'stare', stare: 'stare',
    pensar: 'think', think: 'think',
    pulgar: 'thumbsup', like: 'thumbsup', thumbsup: 'thumbsup',
    bonk: 'bonk', comer: 'nom', nom: 'nom',
    correr: 'run', run: 'run', dormir: 'sleep', siesta: 'sleep', sleep: 'sleep',
    tonto: 'baka', baka: 'baka',
    lamer: 'lick', lick: 'lick', disparar: 'shoot', shoot: 'shoot',
    dudar: 'shrug', shrug: 'shrug',
    asustado: 'shocked', sorpresa: 'shocked', shocked: 'shocked',
    reverencia: 'salute', saludo_militar: 'salute', salute: 'salute',
    apreton: 'handshake', handshake: 'handshake',
    negacion: 'nope', no: 'nope', meh: 'bleh', aburrido: 'bored', bored: 'bored',
    espiar: 'lurk', acecho: 'lurk', lurk: 'lurk',
    mesa: 'tableflip', girartabla: 'tableflip', tableflip: 'tableflip',
    cargar: 'carry', girar: 'spin', spin: 'spin', festejo: 'teehee', teehee: 'teehee',
    asentir: 'nod', cabecear: 'nod',
    confuso: 'confused', confused: 'confused',
    sacudir: 'shake', shake: 'shake',
    patear: 'kick', kick: 'kick', palmada: 'facepalm', facepalm: 'facepalm',
    bostezar: 'yawn', yawn: 'yawn', trotar: 'wag', cola: 'wag', wag: 'wag',
    miau: 'nya', nya: 'nya', regazo: 'lappillow', lappillow: 'lappillow',
    kabedon: 'kabedon', sutil: 'kabedon',
    suave: 'cuddle',
};

// Nombres "bonitos" para mostrar en la ayuda y en los créditos.
const DISPLAY_NAMES = {
    angry: 'Enfadado', baka: 'Idiota', bite: 'Morder', bleh: 'Bleh',
    blowkiss: 'Beso al aire', blush: 'Sonrojar', bonk: 'Bonk', bored: 'Aburrido',
    carry: 'Cargar', clap: 'Aplaudir', confused: 'Confundido', cry: 'Llorar',
    cuddle: 'Acurrucar', dance: 'Bailar', facepalm: 'Palmada en la cara',
    feed: 'Alimentar', handhold: 'De la mano', handshake: 'Chocar la mano',
    happy: 'Feliz', highfive: 'Chocar los cinco', hug: 'Abrazo', kabedon: 'Kabedon',
    kick: 'Patear', kiss: 'Beso', lappillow: 'Pillow lap', laugh: 'Reír',
    lurk: 'Acechar', nod: 'Asentir', nom: 'Comer', nope: 'Negar', nya: 'Nya',
    pat: 'Acariciar', peck: 'Picar', poke: 'Pinchar', pout: 'Enfado',
    punch: 'Golpear', run: 'Correr', salute: 'SaludarFormal', shake: 'Sacudir',
    shocked: 'Sorprendido', shoot: 'Disparar', shrug: 'Dudar', sip: 'Chupar',
    slap: 'Bofetada', sleep: 'Dormir', smile: 'Sonreír', smug: 'Presumido',
    spin: 'Girar', stare: 'Mirar fijamente', tableflip: 'Tirar la mesa',
    teehee: 'Risa contenida', think: 'Pensar', thumbsup: 'Pulgar arriba',
    tickle: 'Cosquillas', wag: 'Cola', wave: 'Saludar', wink: 'Guiñar',
    yawn: 'Bostezar', yeet: 'Lanzar', comfy: 'Acomodarse', fluff: ' espona',
    lay: 'Tumbarse', lick: 'Lamer', tail: 'Cola', icon: 'Icono',
    waifu: 'Waifu', neko: 'Neko', kitsune: 'Kitsune', husbando: 'Husbando',
    shiro: 'Shiro', senko: 'Senko', okami: 'Okami', holo: 'Holo',
};

// --- Proveedores -------------------------------------------------------------

/**
 * nekos.best. Exige un User-Agent con formato "App (contacto)": sin eso, o con
 * uno de relleno, responde 403 (ver src/lib/http.js).
 *
 * La API tiene dos formas de respuesta según la categoría:
 *   · GIFs    → { anime_name, url, dimensions }
 *   · Imágenes → { artist_name, artist_href, source_url, url, dimensions }
 * Por eso el crédito se arma con lo que venga, sin asumir un formato.
 */
async function fromNekosBest(endpoint) {
    const data = await http.getJson(`https://nekos.best/api/v2/${endpoint}`, {
        provider: 'nekos.best',
        timeout: 9000,
        retries: 1,
    });
    const result = data?.results?.[0];
    if (!result?.url) throw new Error('nekos.best: respuesta sin url');
    return {
        url: result.url,
        source: 'nekos.best',
        // GIFs traen el anime; imágenes traen el autor y el link de origen.
        anime: result.anime_name || null,
        author: result.artist_name || null,
        sourceUrl: result.source_url || null,
        width: result.dimensions?.width || null,
        height: result.dimensions?.height || null,
    };
}

/** purrbot.site. Devuelve { link }. */
async function fromPurrbot(endpoint) {
    const data = await http.getJson(`https://api.purrbot.site/v2/img/sfw/${endpoint}/gif`, {
        provider: 'purrbot.site',
        timeout: 9000,
        retries: 1,
    });
    if (!data?.link) throw new Error('purrbot: respuesta sin link');
    return { url: data.link, source: 'purrbot.site', anime: null, width: null, height: null };
}

/** purrbot para imágenes fijas (waifu/neko/kitsune). */
async function fromPurrbotImage(endpoint) {
    const data = await http.getJson(`https://api.purrbot.site/v2/img/sfw/${endpoint}/img`, {
        provider: 'purrbot.site',
        timeout: 9000,
        retries: 1,
    });
    if (!data?.link) throw new Error('purrbot: respuesta sin link');
    return { url: data.link, source: 'purrbot.site', anime: null };
}

/** Arma la cadena de proveedores para una categoría. */
function providersFor(category, { image = false } = {}) {
    const spec = ALL_CATEGORIES[category] || CHARACTER_CATEGORIES[category] || {};
    const list = [];
    if (spec.nekosbest) {
        list.push({ name: 'nekos.best', run: () => (image ? fromNekosBest(spec.nekosbest) : fromNekosBest(spec.nekosbest)) });
    }
    if (spec.purrbot) {
        list.push({ name: 'purrbot.site', run: () => (image ? fromPurrbotImage(spec.purrbot) : fromPurrbot(spec.purrbot)) });
    }
    return list;
}

// --- API pública -------------------------------------------------------------

/**
 * GIF para una acción (hug, kiss, bonk, spins...).
 * @param {string} action clave de Gif_CATEGORIES/EXTRA_CATEGORIES
 * @returns {Promise<{url: string, source: string, anime: string|null, provider: string}>}
 */
async function getActionGif(action) {
    const key = String(action || '').toLowerCase();
    const list = providersFor(key);
    if (!list.length) throw new Error(`Categoría de GIF desconocida: "${action}"`);

    const { value, provider } = await withFallback(list, { label: `gif:${key}`, context: key });
    return { ...value, provider };
}

/**
 * Imagen fija de personaje (waifu, neko, kitsune, husbando, shiro…).
 * @param {string} kind
 */
async function getCharacterImage(kind) {
    const key = String(kind || 'waifu').toLowerCase();
    const spec = CHARACTER_CATEGORIES[key];
    if (!spec) throw new Error(`Categoría de imagen desconocida: "${kind}"`);

    const list = [];
    if (spec.nekosbest) list.push({ name: 'nekos.best', run: () => fromNekosBest(spec.nekosbest) });
    if (spec.purrbot) list.push({ name: 'purrbot.site', run: () => fromPurrbotImage(spec.purrbot) });

    const { value, provider } = await withFallback(list, { label: `img:${key}`, context: key });
    return { ...value, provider };
}

/**
 * Busca una categoría a partir de texto libre del usuario.
 * `searchGif('abrazos')` → 'hug'. Devuelve null si no hay coincidencia.
 * @param {string} query
 * @returns {string|null}
 */
function matchCategory(query) {
    const q = String(query || '')
        .toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .trim();
    if (!q) return null;

    const norm = (s) => String(s).toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]/g, '');

    if (ALL_CATEGORIES[q]) return q;
    if (ALIASES[q]) return ALIASES[q];

    for (const [word, target] of Object.entries(ALIASES)) {
        if (norm(q) === norm(word)) return target;
    }
    for (const key of Object.keys(ALL_CATEGORIES)) {
        if (norm(q) === norm(key)) return key;
    }
    // coincidencia parcial: "quiero un abrazo grande" → hug
    const words = q.split(/\s+/);
    for (const w of words) {
        if (ALIASES[w]) return ALIASES[w];
    }
    for (const w of words) {
        for (const key of Object.keys(ALL_CATEGORIES)) {
            if (norm(key).startsWith(norm(w)) && w.length >= 3) return key;
        }
    }
    return null;
}

/**
 * Buscar y devolver un GIF por texto libre.
 * @param {string} query
 * @returns {Promise<{url: string, category: string, displayName: string, source: string, provider: string, anime: string|null}|{error: 'sin-coincidencia', sugeridas: string[]}>}
 */
async function searchGif(query) {
    const category = matchCategory(query);
    if (!category) {
        return {
            error: 'sin-coincidencia',
            sugeridas: Object.keys(GIF_CATEGORIES).slice(0, 25),
        };
    }
    const gif = await getActionGif(category);
    return { ...gif, category, displayName: DISPLAY_NAMES[category] || category };
}

/** Todas las claves de categoría de GIF. */
function listGifCategories() {
    return Object.keys(ALL_CATEGORIES);
}

/** Todas las claves de imagen de personaje. */
function listCharacterCategories() {
    return Object.keys(CHARACTER_CATEGORIES);
}

/** true si la categoría existe en algún proveedor. */
function hasCategory(key) {
    return Boolean(ALL_CATEGORIES[key] || CHARACTER_CATEGORIES[key]);
}

module.exports = {
    getActionGif, getCharacterImage, searchGif, matchCategory,
    listGifCategories, listCharacterCategories, hasCategory,
    GIF_CATEGORIES, CHARACTER_CATEGORIES, EXTRA_CATEGORIES, ALIASES, DISPLAY_NAMES,
};
