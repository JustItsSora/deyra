// src/lib/http.js
// Cliente HTTP para todo lo que el bot consume de afuera.
//
// Por qué existe y no usar `fetch` pelado:
//
//   1. User-Agent. Varias de las APIs que usa Deyra (nekos.best, purrbot.site)
//      rechazan las peticiones SIN User-Agent con un 403 explícito. Con el
//      `fetch` pelado de Node, todos los GIFs de anime devolvían error: el
//      comando.exists() y lo único que respondía era el respaldo.
//   2. Timeout. `fetch` no tiene timeout por defecto: un proveedor colgado
//      dejaba el comando sin responder nunca (y el interaction se caía a los
//      3 minutos).
//   3. Reintentos ante fallos de red o 429/5xx, con backoff.
//   4. Cache en memoria con TTL, para no pegarle a la misma API 5 veces por
//      segundo cuando 50 personas usan /ping al mismo tiempo.

const config = require('../config');

const DEFAULT_TIMEOUT = 12000;
const DEFAULT_RETRIES = 1;

// User-Agent: "NOMBRE (CONTACTO)".
//
// El formato lo exige la API de nekos.best y lo recomiendan las de más encima.
// NO es opcional: sin un UA identificable devuelven 403 y los GIFs dejan de
// funcionar. Tampoco hay que mandarse de navegador: esas APIs lo detectan y
// bloquean igual (y está explícitamente prohibido en sus términos).
//
// Configurá el contacto en config.js → HTTP.contact, o en la variable de
// entorno HTTP_CONTACT: poné tu repo, tu web o tu página de top.gg. Con un
// valor de relleno (example.com, localhost, un email) nekos.best responde 403.
const HTTP_CONFIG = config.HTTP || {};
const APP_NAME = HTTP_CONFIG.appName || `${config.BOT_NAME || 'Deyra'}Bot`;
const CONTACT = HTTP_CONFIG.contact || 'https://github.com/ryu/deyra';

const USER_AGENT = `${APP_NAME} (${CONTACT})`;

class HttpError extends Error {
    constructor(message, { status, provider, cause } = {}) {
        super(message);
        this.name = 'HttpError';
        this.status = status;
        this.provider = provider;
        this.cause = cause;
    }
}

// --- Cache en memoria con TTL ----------------------------------------------

const cache = new Map();

/** Limpia entradas vencidas. Corre sola por intervalo, sin timers por entrada. */
const CACHE_SWEEP_MS = 5 * 60 * 1000;
const sweeper = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of cache) {
        // Se borra solo cuando pasó la ventana de gracia, no al vencer el TTL:
        // mientras dure, sirve de respaldo si el proveedor se cae.
        if (entry.hardExpire <= now) cache.delete(key);
    }
}, CACHE_SWEEP_MS);
sweeper.unref?.(); // no impedir que el proceso termine

function cacheKey(method, url, body) {
    return `${method}:${url}:${body ? JSON.stringify(body) : ''}`;
}

/**
 * @param {string} url
 * @param {object} [options]
 * @param {number} [options.ttl] Cache en ms (0 = sin cache). Por defecto 0.
 * @returns {any|null} El valor cacheado o `null` si no hay.
 */
function getCache(url, ttl) {
    if (!ttl) return null;
    const entry = cache.get(cacheKey('GET', url));
    if (!entry) return null;
    if (entry.expires <= Date.now()) {
        // Vencida: no se borra. Se conserva un rato más para poder servirla
        // como respaldo si el proveedor está caído (ver `stale`).
        if (entry.hardExpire <= Date.now()) {
            cache.delete(cacheKey('GET', url));
            return null;
        }
        return null;
    }
    return entry.value;
}

/**
 * Entrada vencida pero todavía dentro de la ventana de gracia.
 * Se usa SOLO cuando la petición falla: un dato viejo es infinitamente mejor
 * que un error, y para este bot (fichas de anime, recetas, precios) una hora de
 * atraso no cambia nada.
 */
function getStale(url) {
    const entry = cache.get(cacheKey('GET', url));
    if (!entry) return null;
    if (entry.hardExpire <= Date.now()) {
        cache.delete(cacheKey('GET', url));
        return null;
    }
    return entry.value;
}

function setCache(url, ttl, value) {
    if (!ttl) return;
    const now = Date.now();
    cache.set(cacheKey('GET', url), {
        value,
        expires: now + ttl,
        // Ventana de gracia: 6x el TTL, con un piso de 10 minutos.
        hardExpire: now + Math.max(ttl * 6, 10 * 60 * 1000),
    });
}

/** Vacía toda la cache (comando /reload, tests). */
function clearCache() {
    cache.clear();
}

/** Cuántas entradas hay ahora. Para diagnóstico en /botinfo. */
function cacheSize() {
    return cache.size;
}

// --- Petición base ----------------------------------------------------------

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Petición HTTP con timeout, reintentos y User-Agent.
 * @param {string} url
 * @param {object} [opts]
 * @param {string} [opts.method='GET']
 * @param {object} [opts.headers]
 * @param {object} [opts.json] Cuerpo JSON.
 * @param {number} [opts.timeout]
 * @param {number} [opts.retries]
 * @param {boolean} [opts.retryOnTimeout] Reintentar también cuando se venció
 *   el timeout (por defecto no: el deadline ya se fue).
 * @param {number} [opts.ttl] Cache en ms (solo GET sin cuerpo).
 * @param {string} [opts.provider] Nombre para los logs/errores.
 * @returns {Promise<Response>}
 */
async function request(url, opts = {}) {
    const {
        method = 'GET', headers = {}, json, timeout = DEFAULT_TIMEOUT,
        retries = DEFAULT_RETRIES, ttl = 0, provider, retryOnTimeout = false, ...rest
    } = opts;

    if (method === 'GET' && !json) {
        const cached = getCache(url, ttl);
        if (cached) {
            return new Response(cached.body, {
                status: 200,
                headers: { 'content-type': cached.contentType },
            });
        }
    }

    const finalHeaders = {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json, text/plain, */*',
        ...headers,
    };
    if (json !== undefined) finalHeaders['Content-Type'] = 'application/json';

    const cacheable = method === 'GET' && !json && ttl > 0;

    let lastError;
    for (let attempt = 0; attempt <= retries; attempt++) {
        // El AbortController va POR INTENTO: si el deadline se venció en un
        // intento, el siguiente necesita su propio tiempo. Con un solo timer
        // para todos los intentos, el reintento moría abortado al instante.
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeout);

        try {
            const res = await fetch(url, {
                method,
                headers: finalHeaders,
                body: json !== undefined ? JSON.stringify(json) : undefined,
                signal: controller.signal,
                ...rest,
            });

            // Reintentables: rate limit y errores del servidor.
            if (res.status === 429 || res.status >= 500) {
                const retryAfter = Number(res.headers.get('retry-after')) * 1000;
                if (attempt < retries) {
                    await sleep(Number.isFinite(retryAfter) && retryAfter > 0
                        ? Math.min(retryAfter, 3000)
                        : 400 * (attempt + 1));
                    continue;
                }
            }

            if (!res.ok) {
                throw new HttpError(`HTTP ${res.status} en ${url}`, { status: res.status, provider });
            }

            // Para cachear hay que LEER el body, y un body se lee una sola
            // vez. Guardamos los bytes y reconstruimos la Response para el
            // llamador: si guardáramos la Response, el segundo acierto de
            // caché fallaría con "body used already".
            if (cacheable) {
                const body = await res.arrayBuffer();
                const contentType = res.headers.get('content-type') || 'application/octet-stream';
                setCache(url, ttl, { body, contentType });
                return new Response(body, { status: res.status, headers: { 'content-type': contentType } });
            }

            return res;
        } catch (err) {
            lastError = err;
            const timedOut = err.name === 'AbortError';
            // Un abort por timeout normalmente no tiene sentido reintentarlo
            // dentro de la misma llamada (el deadline ya se venció), salvo que
            // el que llama pida lo contrario (ej: Jikan, que es lento pero
            // vuelve a responder si se espera un poco más).
            if ((timedOut && !retryOnTimeout) || attempt === retries) break;
            await sleep(300 * (attempt + 1));
        } finally {
            clearTimeout(timer);
        }
    }

    const detail = lastError?.name === 'AbortError' ? `timeout de ${timeout}ms` : (lastError?.message || 'sin detalle');

    // Stale-if-error: si hay una copia vieja dentro de la ventana de gracia, la
    // devolvemos en vez de propagar el error. Un dato de hace diez minutos le
    // sirve al usuario; un error no.
    if (cacheable) {
        const stale = getStale(url);
        if (stale) {
            console.warn(`[http] ${provider || url}: ${detail} → sirviendo copia en caché.`);
            return new Response(stale.body, {
                status: 200,
                headers: { 'content-type': stale.contentType },
            });
        }
    }

    throw new HttpError(`${provider ? `[${provider}] ` : ''}${detail} (${url})`, {
        status: lastError?.status,
        provider,
        cause: lastError,
    });
}

/** Petición que devuelve JSON parseado. */
async function getJson(url, opts = {}) {
    const res = await request(url, opts);
    try {
        return await res.json();
    } catch (err) {
        throw new HttpError(`Respuesta no es JSON válido: ${url}`, { provider: opts.provider, cause: err });
    }
}

/** Petición que devuelve texto plano. */
async function getText(url, opts = {}) {
    const res = await request(url, opts);
    return res.text();
}

/** Petición que devuelve un Buffer (imágenes binarias). */
async function getBuffer(url, opts = {}) {
    const res = await request(url, opts);
    return Buffer.from(await res.arrayBuffer());
}

/** POST con cuerpo JSON. */
function postJson(url, body, opts = {}) {
    return request(url, { ...opts, method: 'POST', json: body });
}

module.exports = {
    request, getJson, getText, getBuffer, postJson,
    clearCache, cacheSize, getCache, setCache,
    HttpError, USER_AGENT, DEFAULT_TIMEOUT,
};
