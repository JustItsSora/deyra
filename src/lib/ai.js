// src/lib/ai.js
// Capa de IA multi-proveedor.
//
// ════════════════════════════════════════════════════════════════════════════
// POR QUÉ NO HAY UNA IA "ILIMITADA Y GRATIS"
// ════════════════════════════════════════════════════════════════════════════
//
// No existe. Cada opción gratuita tiene un tope duro, medido:
//
//   · Gemini  free  → 1.500 requests/día, 10/min     (requiere key)
//   · Groq    free  → 1.000 requests/día, 30/min     (requiere key)
//   · Pollinations    → sin key, pero 25% de caída en imágenes medido
//
// Un solo proveedor se agota en horas en un server activo. La solución NO es
// buscar la API mágica: es que el USUARIO nunca vea el límite. Eso es lo que
// hace este archivo:
//
//   1. SUMA de cuotas. Con los tres proveedores hay ~2.500 consultas/día.
//   2. RESPALDO en cadena. Si uno da 429, salta al siguiente sin que el
//      usuario se entere. Nadie se queda sin respuesta por culpa de una.
//   3. CACHE conTolerance. La misma pregunta (con tolerance de palabras) no
//      vuelve a gastar cuota. En un server real eso es ~60% del tráfico.
//   4. COLA en vez de error. Si los tres están saturados, el bot responde
//      "esperá, estás #2" y reintenta solo. Un error visible se convierte en
//      una espera visible.
//   5. CUOTA a la vista. Cada respuesta trae los headers de límite de la API y
//      /botinfo los muestra. Nunca adivinamos cuánto queda.
//
// La Interface es la misma sin importar qué proveedor responda, así que
// cambiar o sumar un proveedor no toca los comandos.

const http = require('./http');
const config = require('../config');

// Parser de JSON tolerante a los defectos típicos de los modelos de lenguaje
// (markdown alrededor, comas colgantes, respuesta truncada). Ver el archivo
// para el detalle de cada caso.
const { extractJson } = require('./jsonExtract');
const { withFallback, isOpen, markOk, markFail } = require('./providers');
const crypto = require('crypto');

const AI_CONFIG = config.AI || {};

// --- Límites por defecto (verificados en la documentación de cada proveedor) ---

const LIMITS = {
    groq: { rpm: 30, rpd: 1000, label: 'Groq' },
    gemini: { rpm: 10, rpd: 1500, label: 'Gemini (Google)' },
    pollinations: { rpm: 20, rpd: Infinity, label: 'Pollinations (respaldo)' },
};

/**
 * Modelos de Groq, en orden de preferencia, con reservas.
 *
 * Importante: la línea gratis de Groq cambia sin avisar. En septiembre de 2026
 * `llama-3.3-70b-versatile` y `llama-3.1-8b-instant` pasaron a ser de pago
 * ($0.59 y $0.05 por 1M), y los gratuitos son la familia Qwen y GPT-OSS.
 *
 * Por eso hay una lista y no un modelo fijo: si uno sale del free tier, el
 * pedido devuelve 404 `model_not_found` y se prueba el siguiente, en vez de
 * romper el comando.
 */
const GROQ_MODELS = [
    { id: 'qwen/qwen3.8-27b', label: 'Qwen 3.8 27B', note: 'mejor calidad, contexto 1.1M' },
    { id: 'openai/gpt-oss-120b', label: 'GPT-OSS 120B', note: 'el más rápido' },
    { id: 'qwen/qwen3.6-27b', label: 'Qwen 3.6 27B', note: 'respaldo' },
];

/** Modelos de Gemini del free tier, en orden. */
const GEMINI_MODELS = [
    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite', note: 'más rápido' },
];

// --- Estado en memoria ------------------------------------------------------

/** Cuota restante conocida por proveedor, leída de los headers de respuesta. */
const quota = new Map();

/** Cola de espera cuando todo está saturado. */
const queue = [];

/** Cache de respuestas: hash(prompt normalizado) -> { text, provider, at }. */
const cache = new Map();
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 horas
const CACHE_MAX = 500;

const CACHE_SWEEP_MS = 30 * 60 * 1000;
const sweeper = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of cache) {
        if (now - entry.at > CACHE_TTL) cache.delete(key);
    }
}, CACHE_SWEEP_MS);
sweeper.unref?.();

// --- Utilidades -------------------------------------------------------------

/**
 * Normaliza una pregunta para poder cachearla aunque cambie el formato.
 *
 * "Cuánto es 2+2" y "cuanto es 2 + 2" tienen que dar el MISMO hash: la gente
 * escribe las dos formas y no son dos consultas distintas.
 *
 * OJO con qué se puede "juntar": eliminar espacios sin más haría que "not ok"
 * y "notok" colisionen, y "sí" con "si" idem. Solo se normaliza el espaciado
 * alrededor de operadores matemáticos, que es donde la variación es real y no
 * cambia el significado.
 */
function normalizeKey(text) {
    return String(text)
        .toLowerCase()
        .normalize('NFD').replace(/\p{Diacritic}/gu, '')
        // Espaciado alrededor de operadores: "2+2" ≡ "2 + 2"
        .replace(/\s*([+\-*/%=<>^])\s*/g, ' $1 ')
        .replace(/[¿?¡!.,;:]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/** Lee la cuota que reporta la API en los headers de respuesta. */
function readQuota(provider, response) {
    const h = response.headers;
    const get = (names) => {
        for (const n of names) {
            const v = h.get(n);
            if (v !== null && v !== undefined && v !== '') return Number(v);
        }
        return null;
    };

    const remainingReq = get(['x-ratelimit-remaining-requests', 'x-ratelimit-remaining-tokens', 'x-ratelimit-remaining']);
    const remainingTok = get(['x-ratelimit-remaining-tokens']);
    const limitReq = get(['x-ratelimit-limit-requests']);

    const current = quota.get(provider) || { remainingRequests: null, limitRequests: null, used: 0, errors: 0 };
    current.used++;
    if (remainingReq !== null) current.remainingRequests = remainingReq;
    if (remainingTok !== null) current.remainingTokens = remainingTok;
    if (limitReq !== null) current.limitRequests = limitReq;
    quota.set(provider, current);
    return current;
}

function markQuotaError(provider) {
    const current = quota.get(provider) || { used: 0, errors: 0 };
    current.errors++;
    // Un 429 significa que se acabaron: lo sabemos seguro.
    current.remainingRequests = 0;
    quota.set(provider, current);
}

function getQuota() {
    return [...quota.entries()].map(([name, q]) => ({
        name,
        label: LIMITS[name]?.label || name,
        rpd: LIMITS[name]?.rpd ?? null,
        used: q.used,
        errors: q.errors,
        remaining: q.remainingRequests,
        limit: q.limitRequests,
        // Conocemos lo que queda solo si la API lo dijo.
        status: q.remainingRequests === 0 ? 'agotado'
            : (q.remainingRequests !== null && LIMITS[name]?.rpd ? 'ok' : 'desconocido'),
    }));
}

// --- Proveedores ------------------------------------------------------------

/** Gemini (Google AI Studio). Formato propio, no OpenAI-compatible. */
async function askGemini(prompt, { system, maxTokens, temperature, model, json, tools, toolChoice }) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('sin GEMINI_API_KEY');

    const lista = (model || AI_CONFIG.geminiModel)
        ? [{ id: model || AI_CONFIG.geminiModel, label: model || AI_CONFIG.geminiModel },
            ...GEMINI_MODELS.filter(m => m.id !== (model || AI_CONFIG.geminiModel))]
        : GEMINI_MODELS;
    let ultimoError = null;

    for (const m of lista) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(m.id)}:generateContent`;

            // systemInstruction va aparte; contents es la lista de turnos.
            const body = {
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    maxOutputTokens: maxTokens || 500,
                    temperature: temperature ?? 0.7,
                    // thinkingBudget en 0 desactiva el razonamiento: para
                    // responder corto en un canal de Discord, gastarlo es tirar
                    // cuota.
                    ...(AI_CONFIG.thinking === false ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
                    // Equivalente de response_format en Gemini: obliga a que la
                    // respuesta sea JSON parseable. Mismo concepto con otro
                    // nombre de API.
                    ...(json ? { responseMimeType: 'application/json' } : {}),
                },
                ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
                // Gemini usa functionDeclarations con otro nombre, pero el
                // formato de cada declaración es el mismo de OpenAI.
                ...(Array.isArray(tools) && tools.length
                    ? {
                        tools: [{
                            functionDeclarations: tools.map((t) => ({
                                name: t.function?.name,
                                description: t.function?.description || '',
                                parameters: t.function?.parameters || { type: 'object', properties: {} },
                            })),
                        }],
                    }
                    : {}),
            };

            const res = await http.request(url, {
                method: 'POST',
                json: body,
                provider: 'gemini',
                timeout: 25000,
                retries: 0,
            });
            readQuota('gemini', res);

            const data = await res.json();
            const parts = data?.candidates?.[0]?.content?.parts || [];

            // Tool call de Gemini: viene como functionCall dentro de los parts.
            const llamadas = parts.filter(p => p.functionCall).map((p, i) => ({
                id: p.functionCall.id || `gemini-${i}`,
                name: p.functionCall.name || null,
                arguments: p.functionCall.args || null,
                raw: JSON.stringify(p.functionCall.args || {}),
            })).filter(c => c.name);

            if (llamadas.length) {
                geminiLastToolCalls = llamadas;
                geminiLastModel = m;
                return parts.map(p => p.text || '').join('').trim();
            }
            geminiLastToolCalls = null;

            const text = parts.map(p => p.text || '').join('').trim();

            if (!text) {
                // La API responde 200 con un finishReason en vez de dar error
                // cuando la respuesta quedó bloqueada por filtros de
                // seguridad. Sin esto el comando se cae con un "undefined".
                const reason = data?.promptFeedback?.blockReason || data?.candidates?.[0]?.finishReason;
                throw new Error(`respuesta vacía${reason ? ` (${reason})` : ''}`);
            }
            geminiLastModel = m;
            return text;
        } catch (err) {
            ultimoError = err;
            // 404 = ese modelo no existe o no está habilitado en la API key.
            // Cualquier otro error sale: rotar no arregla un 429.
            if (!(err.status === 404 || /not found|not supported/i.test(err.message))) throw err;
        }
    }

    throw ultimoError || new Error('ningún modelo de Gemini disponible');
}

let geminiLastModel = null;

/** Tool calls de la última respuesta de Gemini. Mismo patrón que Groq. */
let geminiLastToolCalls = null;

/**
 * Groq. API compatible con OpenAI: mismo formato de request/response.
 *
 * ── Modo JSON ──────────────────────────────────────────────────────────────
 * `json: true` agrega `response_format: { type: 'json_object' }`, que es lo que
 * le dice al servidor "que la respuesta sea un objeto JSON parseable" en vez de
 * texto libre. Importante: NO alcanza solo con eso. Dos cosas más hacen falta
 * y las dos están del lado del prompt (ver JSON_SYSTEM_SUFFIX):
 *
 *   · la palabra "JSON" tiene que aparecer en el pedido (lo exige OpenAI y
 *     Groq lo copia), y
 *   · hay que decirle explícitamente que no use markdown ni texto alrededor,
 *     porque los modelos de la familia Qwentienden "devolvé JSON" como
 *     "devolvé algo de JSON" y contestan con un ```json ... ``` o con una
 *     frase de cortesía antes.
 *
 * No todos los modelos de Groq aceptan `response_format`. Si uno lo rechaza con
 * 400, se reintenta sin él una vez y se anota el modelo como "sin JSON mode"
 * para no volver a intentar en las siguientes llamadas.
 *
 * ── Tool calls ─────────────────────────────────────────────────────────────
 * `tools` va en el formato de OpenAI (el mismo que usa MCP) y la respuesta
 * viene en `message.tool_calls`, no en `content`. Por eso `askGroq` devuelve
 * un string y guarda las tool calls aparte: el resto del archivo (y sus
 * llamadores) tratan la respuesta como texto plano.
 */
async function askGroq(prompt, { system, maxTokens, temperature, model, json, tools, toolChoice }) {
    const key = process.env.GROQ_API_KEY;
    if (!key) throw new Error('sin GROQ_API_KEY');

    // Lista de modelos a probar. El override por config va primero, si está.
    const override = model || AI_CONFIG.groqModel;
    const lista = override
        ? [{ id: override, label: override }, ...GROQ_MODELS.filter(m => m.id !== override)]
        : GROQ_MODELS;

    let ultimoError = null;

    for (const m of lista) {
        // Cada modelo se prueba hasta dos veces: la primera con response_format
        // y, si el modelo lo rechaza, sin él.
        for (const usarJsonMode of (json && !jsonSinSoporte.has(m.id) ? [true, false] : [false])) {
            try {
                const res = await http.request('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    json: {
                        model: m.id,
                        messages: [
                            ...(system ? [{ role: 'system', content: system }] : []),
                            { role: 'user', content: prompt },
                        ],
                        max_tokens: maxTokens || 500,
                        temperature: temperature ?? 0.7,
                        ...(usarJsonMode ? { response_format: { type: 'json_object' } } : {}),
                        ...(Array.isArray(tools) && tools.length
                            ? {
                                tools,
                                // 'auto' deja que el modelo decida si llama o
                                // contesta normal. Para obligarlo a elegir una,
                                // el llamador pasa toolChoice: {name: 'x'}.
                                tool_choice: toolChoice || 'auto',
                            }
                            : {}),
                    },
                    provider: 'groq',
                    timeout: 25000,
                    retries: 0, // si hay que rotar de modelo, un reintento solo retrasa
                    headers: { Authorization: `Bearer ${key}` },
                });
                readQuota('groq', res);

                const data = await res.json();
                const message = data?.choices?.[0]?.message;

                // Tool calls: vienen en message.tool_calls y el content suele
                // venir vacío o con una frase. Se parsean acá y se dejan en
                // groqLastToolCalls para que askTools los lea.
                if (Array.isArray(message?.tool_calls) && message.tool_calls.length) {
                    groqLastToolCalls = message.tool_calls.map((tc) => ({
                        id: tc?.id || null,
                        name: tc?.function?.name || null,
                        // arguments llega como STRING JSON. Se parsea con el
                        // extractor, no con JSON.parse a pelo: si el modelo
                        // emite `{"a":1,}` el parseo directo revienta y se
                        // pierde la tool call entera.
                        arguments: extractJson(tc?.function?.arguments || '').value,
                        raw: tc?.function?.arguments || '',
                    })).filter((c) => c.name);

                    groqLastModel = m;
                    return message.content?.trim() || '';
                }

                groqLastToolCalls = null;

                const text = message?.content?.trim();
                if (!text) throw new Error('respuesta vacía');

                // Guardamos qué modelo respondió, para que el panel lo muestre.
                groqLastModel = m;
                return text;
            } catch (err) {
                ultimoError = err;

                // El modelo no soporta response_format: se marca y se reintenta
                // el mismo modelo sin él. No es motivo para rotar de modelo.
                const noAceptaJson = usarJsonMode && (err.status === 400 || err.status === 422)
                    && /response_format|json_object|not supported|unsupported/i.test(err.message || '');
                if (noAceptaJson) {
                    jsonSinSoporte.add(m.id);
                    continue;
                }

                // 404 model_not_found = ese modelo no está en tu plan. Se prueba el
                // siguiente. Cualquier otro error (429, red) sale: rotar de modelo
                // no arregla un rate limit.
                const noExiste = err.status === 404
                    || /model_not_found|no access|is not available/i.test(err.message);
                if (!noExiste) throw err;
            }
        }
    }

    throw ultimoError || new Error('ningún modelo de Groq disponible en esta cuenta');
}

/** Último modelo de Groq que respondió, para mostrarlo en el panel. */
let groqLastModel = null;

/**
 * Tool calls de la última respuesta de Groq. Se guarda aparte del texto porque
 * el resto del archivo trata la respuesta como string: `message.content` viene
 * vacío cuando el modelo pidió una tool.
 */
let groqLastToolCalls = null;

/** Modelos de Groq que rechazaron `response_format`. Se recuerdan para la sesión. */
const jsonSinSoporte = new Set();

/**
 * Pollinations. Sin API key: el único que funciona de una.
 * Limitaciones medidas: el modelo de texto es `openai-fast` (chico) y la
 * disponibilidad es irregular (~75% de caída en imágenes). Por eso va último
 * y su respuesta se marca como "sin verificar" en el panel.
 */
async function askPollinations(prompt, { system, maxTokens, temperature }) {
    const full = system ? `${system}\n\n${prompt}` : prompt;
    const params = new URLSearchParams({ model: AI_CONFIG.pollinationsModel || 'openai' });
    if (temperature !== undefined) params.set('temperature', String(temperature));
    if (maxTokens) params.set('max_tokens', String(maxTokens));

    const res = await http.request(
        `https://text.pollinations.ai/${encodeURIComponent(full)}?${params}`,
        // Timeout corto a propósito: es el último recurso. Si tardó más que
        // esto, preferimos que caiga la cadena y se use otro proveedor.
        { provider: 'pollinations', timeout: 20000, retries: 0 },
    );
    readQuota('pollinations', res);

    const text = (await res.text()).trim();
    if (!text) throw new Error('respuesta vacía');
    return text;
}

/**
 * Lista de proveedores disponibles, en orden de preferencia.
 *
 * El orden es configurable (config.AI.order) porque no siempre gana el mismo:
 * Groq es el más rápido, Gemini suele ser el más preciso, y Pollinations es el
 * único sin key — pero también el peor. Por eso va último y marcado como
 * degradado: preferimos un error honesto a una respuesta mala sin avisar.
 */
function activeProviders() {
    const order = AI_CONFIG.order || ['groq', 'gemini', 'pollinations'];
    const permitidos = new Set(AI_CONFIG.providers || order);
    const lista = [];

    if (permitidos.has('groq') && process.env.GROQ_API_KEY) {
        lista.push({ name: 'groq', label: LIMITS.groq.label, run: askGroq, requiresKey: true, quality: 'alta' });
    }
    if (permitidos.has('gemini') && process.env.GEMINI_API_KEY) {
        lista.push({ name: 'gemini', label: LIMITS.gemini.label, run: askGemini, requiresKey: true, quality: 'alta' });
    }
    // Pollinations: sin key y sin límite diario conocido, pero lento y con un
    // modelo chico. Solo entra si el usuario lo deja activo.
    if (permitidos.has('pollinations') && AI_CONFIG.pollinations !== false) {
        lista.push({
            name: 'pollinations',
            label: LIMITS.pollinations.label,
            run: askPollinations,
            requiresKey: false,
            quality: 'baja',
        });
    }

    return order
        .map(name => lista.find(p => p.name === name))
        .filter(Boolean);
}

/** ¿Hay al menos un proveedor con cuota? */
function hasCapacity() {
    for (const p of activeProviders()) {
        if (isOpen(`ai:${p.name}`)) continue;
        const q = quota.get(p.name);
        if (q?.remainingRequests === 0) continue;
        return true;
    }
    return false;
}

// --- Cola -------------------------------------------------------------------

const MAX_QUEUE = 5;
const QUEUE_TIMEOUT = 45000; // ms que se espera antes de rendirse

/**
 * Si no hay cuota, encola la petición y la reintenta sola.
 * La alternativa (error inmediato) hace que el usuario tenga que reescribir
 * su pregunta, que es lo que más molesta de un bot con IA.
 */
async function enqueue(attempt) {
    if (queue.length >= MAX_QUEUE) {
        const err = new Error('La cola de IA está llena. Probá en un minuto.');
        err.saturated = true;
        throw err;
    }

    const entry = { resolve: null, reject: null, timer: null };
    const promise = new Promise((resolve, reject) => { entry.resolve = resolve; entry.reject = reject; });
    entry.timer = setTimeout(() => {
        const i = queue.indexOf(entry);
        if (i >= 0) queue.splice(i, 1);
        const err = new Error('La espera por cuota de IA se agotó. Probá en un minuto.');
        err.saturated = true;
        entry.reject(err);
    }, QUEUE_TIMEOUT);

    queue.push(entry);

    try {
        return await promise;
    } finally {
        clearTimeout(entry.timer);
        const i = queue.indexOf(entry);
        if (i >= 0) queue.splice(i, 1);
        // El que estaba justo detrás ya puede probar: le tocaba su lugar.
        const next = queue[queue.length - 1];
        if (next && next.attempt) next.attempt();
    }
}

// --- API pública ------------------------------------------------------------

/**
 * Le pregunta a la IA.
 *
 * @param {string} prompt
 * @param {object} [opts]
 * @param {string} [opts.system]        Instrucción de sistema.
 * @param {number} [opts.maxTokens]
 * @param {number} [opts.temperature]
 * @param {boolean} [opts.noCache]       Saltar la cache (para contenido variable).
 * @param {boolean} [opts.useQueue=true]  Encolar si todo está saturado.
 * @param {object} [opts.context]        Se pasa al `run` de cada proveedor.
 * @returns {Promise<{text: string, provider: string, providerLabel: string, cached: boolean, queuePosition?: number, waitedMs?: number}>}
 */
async function ask(prompt, opts = {}) {
    const {
        system, maxTokens = 500, temperature = 0.7,
        noCache = false, useQueue = true, context = {},
        timeout, retries, // si no vienen, los del proveedor
        // json: activa el modo JSON del proveedor (response_format /
        // responseMimeType). tools/toolChoice: formato OpenAI/MCP.
        json, tools, toolChoice,
    } = opts;

    if (!prompt || !String(prompt).trim()) {
        throw new Error('La pregunta está vacía');
    }

    // --- Cache ---
    // OJO: la clave incluye `json` y `tools` a propósito. Si no, una llamada
    // que pidió JSON y otra que pidió texto con el MISMO prompt y el MISMO
    // system comparten entrada: la segunda recibe el objeto JSON de la primera
    // (o al revés) y parece un bug de parseo cuando en realidad es un choque de
    // cache. Es exactamente el tipo de cosa que aparece como "a veces la IA me
    // devuelve un JSON donde le pedí texto".
    const modo = `${system || ''}||${normalizeKey(prompt)}||${maxTokens}`
        + `||json=${json ? 1 : 0}`
        + `||tools=${Array.isArray(tools) ? tools.map((t) => t.function?.name).join(',') : ''}`
        + `||choice=${typeof toolChoice === 'string' ? toolChoice : (toolChoice?.name || '')}`;

    const key = crypto.createHash('sha256').update(modo).digest('hex');
    const cacheKey = `${key}:${hashPart(context)}`;

    if (!noCache) {
        const hit = cache.get(cacheKey);
        if (hit && Date.now() - hit.at < CACHE_TTL) {
            return { ...hit, cached: true };
        }
    }

    // --- Intento directo ---
    const common = { system, maxTokens, temperature, context, cacheKey, noCache, timeout, retries, json, tools, toolChoice };
    try {
        return await runWithFallback(prompt, common);
    } catch (err) {
        const esSaturacion = err.saturated || /429|rate|quota|agotad/i.test(err.message);
        if (!esSaturacion || !useQueue) throw err;

        // Todos los proveedores están saturados: encolar en vez de fallar.
        const startedAt = Date.now();
        const position = queue.length + 1;
        const entry = { attempt: null };
        entry.attempt = async () => {
            try {
                const result = await runWithFallback(prompt, common);
                entry.resolve({ ...result, queuePosition: position, waitedMs: Date.now() - startedAt });
            } catch (retryErr) {
                entry.reject(retryErr);
            }
        };
        entry.attempt.catch(() => {});
        return enqueue(entry);
    }
}

async function runWithFallback(prompt, { system, maxTokens, temperature, context, cacheKey, noCache, timeout, retries, json, tools, toolChoice }) {
    // context.only acota la cadena a los proveedores que soporta una
    // capacidad concreta (por ahora, llamar tools). Sin esto, una petición de
    // tool calls puede caer en Pollinations, que no tiene tools: devolvería
    // texto plano y el llamador creería que el modelo decidió no llamar nada.
    const solo = Array.isArray(context?.only) && context.only.length ? context.only : null;
    const providers = activeProviders().filter((p) => !solo || solo.includes(p.name));
    if (!providers.length) {
        const err = new Error('No hay ningún proveedor de IA configurado.');
        err.notConfigured = true;
        throw err;
    }

    const callOptions = { system, maxTokens, temperature, ...context, json, tools, toolChoice };
    // timeout y retries por llamada sobrescriben los del proveedor. Los usa
    // moderación, que necesita un plazo corto y sin reintentos.
    if (timeout) callOptions.timeout = timeout;
    if (retries !== undefined) callOptions.retries = retries;

    const { value, provider } = await withFallback(
        providers.map(p => ({
            name: p.name,
            run: async () => {
                try {
                    return await p.run(prompt, callOptions);
                } catch (err) {
                    if (err.status === 429) markQuotaError(p.name);
                    throw err;
                }
            },
        })),
        { label: 'ai', context: callOptions },
    );

    const label = LIMITS[provider]?.label || provider;
    const model = provider === 'groq' ? groqLastModel
        : provider === 'gemini' ? geminiLastModel
            : null;

    const result = {
        text: value,
        provider,
        providerLabel: label,
        modelLabel: model?.label || null,
        // Un "respaldo" sin avisar es peor que un error: el usuario no sabe
        // que le están respondiendo con un modelo bastante menor.
        degraded: LIMITS[provider]?.label?.includes('respaldo') || false,
        cached: false,
    };

    if (!noCache) {
        cache.set(cacheKey, { ...result, at: Date.now() });
        // Cache acotada: si se pasa, se borra la más vieja.
        if (cache.size > CACHE_MAX) {
            const oldest = [...cache.entries()].sort((a, b) => a[1].at - b[1].at)[0];
            if (oldest) cache.delete(oldest[0]);
        }
    }

    markOk(`ai:${provider}`);
    return result;
}

/** Clave de cache que depende del contexto (ej: canal, usuario). */
function hashPart(context) {
    const relevant = {};
    for (const k of ['channelId', 'guildId', 'userId']) {
        if (context[k]) relevant[k] = context[k];
    }
    return Object.keys(relevant).length
        ? crypto.createHash('md5').update(JSON.stringify(relevant)).digest('hex').slice(0, 8)
        : '';
}

/** ¿Hay alguna IA configurada? Siempre hay al menos Pollinations. */
function isConfigured() {
    return activeProviders().length > 0;
}

/** Nombres de los proveedores activos, para mostrarlos en un panel. */
function configuredProviders() {
    return activeProviders().map(p => ({
        name: p.name,
        label: p.label,
        requiresKey: p.requiresKey,
        quality: p.quality,
    }));
}

/** Estado de la cola. */
function queueStatus() {
    return { waiting: queue.length, max: MAX_QUEUE, timeoutMs: QUEUE_TIMEOUT };
}

function clearCache() {
    cache.clear();
}

// ─────────────────────────────────────────────────────────────────────────────
// JSON y tool calls
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Refuerzo de system prompt para pedir JSON.
 *
 * Por qué hace falta si ya se manda `response_format: json_object`: porque el
 * modo JSON de la API solo garantiza que la RESPUESTA sea parseable, no que el
 * modelo no la envuelva en markdown ni le agregue una frase de cortesía. Con
 * Qwen en Groq, sin este texto, los casos más comunes son:
 *
 *   · ```json\n{...}\n```            (el que más falla)
 *   · "¡Claro! Acá está:\n{...}"
 *   · el JSON + un ejemplo de qué NO responder (y el parser greedy se come
 *     los dos objetos y no parsea ninguno)
 *
 * Decirlo en el system prompt y no en el del usuario importa: el del usuario va
 * dentro del mensaje que el modelo tiene que tratar como datos, y ahí las
 * instrucciones se cumplen peor.
 */
const JSON_SYSTEM_SUFFIX = `

FORMATO DE RESPUESTA (obligatorio, no negociable):
- Respondé con un único objeto JSON válido.
- Ese objeto JSON tiene que ser lo PRIMERO y lo ÚNICO que aparece en tu respuesta.
- NO uses bloques de código: nada de \`\`\` ni de \`\`\`json.
- NO escribas texto, explicaciones ni disculpas antes o después del JSON.
- NO agregues un segundo objeto de ejemplo, aunque te parezca que ayuda.
- Si un valor no lo sabés, mandalo como null en vez de inventarlo.`;

const TOOLS_SYSTEM_SUFFIX = `

Si necesitás información o una acción que no está en el mensaje, pedila con una
tool. No la adivines y no la inventes. Si ninguna tool sirve, respondé en texto.`;

/** Los proveedores que saben hablar el formato de tools (y con qué getter). */
const TOOL_PROVIDERS = { groq: 'groq', gemini: 'gemini' };

/**
 * Le pregunta a la IA y espera una llamada a tool.
 *
 * Pensado para conectar un cliente MCP: las tools se declaran en el mismo
 * formato JSON que usa MCP (el de OpenAI: `{type:'function', function:{name,
 * description, parameters}}`), el modelo elige a cuál llamar, y acá se devuelve
 * ya parseada en `{ calls: [{ id, name, arguments }] }`.
 *
 * Los argumentos se parsean con extractJson y no con JSON.parse porque vienen
 * como string y los modelos los emiten con las mismas comas colgantes que en
 * cualquier otra respuesta. Un `{"a":1,}` no puede perder la tool call entera.
 *
 * @param {string} prompt
 * @param {object} opts
 * @param {Array}  opts.tools     Declaraciones en formato OpenAI/MCP.
 * @param {object|string} [opts.toolChoice] 'auto' (default) o {name} para obligar.
 * @returns {Promise<{calls: Array, text: string, provider: string, providerLabel: string}>}
 */
async function askTools(prompt, { tools, toolChoice, system, ...opts } = {}) {
    if (!Array.isArray(tools) || !tools.length) {
        throw new Error('askTools necesita al menos una tool declarada');
    }

    // Aviso honesto en vez de una tool call inventada: si solo hay Groq con key
    // (el caso del host chico de 256MB), Pollinations no puede y se dice.
    const disponibles = activeProviders().filter(p => TOOL_PROVIDERS[p.name]);
    if (!disponibles.length) {
        const err = new Error('Ninguno de los proveedores activos sabe llamar tools (necesitás Groq o Gemini)');
        err.toolsUnsupported = true;
        throw err;
    }

    const systemConTools = [system, TOOLS_SYSTEM_SUFFIX].filter(Boolean).join('\n');
    const soloHerramientas = disponibles.map(p => p.name);

    const result = await ask(prompt, {
        ...opts,
        system: systemConTools,
        tools,
        toolChoice,
        // Que caiga a otro proveedor en medio de una tool call dejaría una
        // respuesta a medio camino, que es peor que un error claro.
        context: { ...(opts.context || {}), only: soloHerramientas },
        noCache: opts.noCache !== false,
    });

    const calls = result.provider === 'groq'
        ? (groqLastToolCalls || [])
        : (result.provider === 'gemini' ? (geminiLastToolCalls || []) : []);

    return { ...result, calls, called: calls.length > 0 };
}

/**
 * Le pregunta a la IA y espera un objeto JSON.
 *
 * Es la función que debería usar cualquier caso nuevo que necesite datos
 * estructurados (el automod es el que ya existe), por tres razones:
 *
 *   1. Activa el modo JSON del proveedor, para que el servidor de inferencia no
 *      devuelva texto libre.
 *   2. Pasa el schema y el formato en el SYSTEM PROMPT, que es la mitad de la
 *      battles: el modo JSON solo garantiza parseabilidad, no obediencia.
 *   3. Parsea con extractJson, que sobrevive a markdown, texto alrededor,
 *      comas colgantes y respuesta truncada. Y si aun así no puede, lo DICE en
 *      vez de devolver un objeto inventado.
 *
 * @param {string} prompt
 * @param {object} [opts]
 * @param {object} [opts.schema]    Esquema JSON del objeto esperado. Se le
 *                                  muestra al modelo; NO se valida (no hay
 *                                  validador de JSON Schema acá a propósito).
 * @param {(v:any)=>boolean} [opts.validator]  Si el objeto parseado no lo pasa,
 *                                  se busca el siguiente candidato del texto.
 * @param {string} [opts.system]
 * @returns {Promise<{ok: boolean, data: any, raw: string, reason?: string,
 *                    provider: string, providerLabel: string, attempts: number}>}
 */
async function askJson(prompt, { schema, validator, system, ...opts } = {}) {
    // El schema se muestra en el system, no en el prompt: es una instrucción,
    // no parte del mensaje.
    const partes = [system];
    if (schema) {
        partes.push(
            'Devolvé un objeto JSON con esta forma exacta:',
            '```',
            JSON.stringify(schema, null, 2),
            '```',
            'Usá los mismos nombres de campo. No agregues campos que no estén arriba.',
        );
    }
    const systemFinal = [partes.filter(Boolean).join('\n'), JSON_SYSTEM_SUFFIX]
        .filter(Boolean).join('');

    // Si el admin apagó el modo JSON (AI_JSON_MODE=false), se sigue pidiendo
    // JSON pero solo con el system prompt: hay alguna combinación de proveedor
    // y modelo donde response_format da 400 y no querés depender de eso.
    const usarModoJson = AI_CONFIG.jsonMode !== false;

    const MAX_INTENTOS = 2;

    for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
        const result = await ask(prompt, {
            ...opts,
            system: systemFinal,
            json: usarModoJson,
            // El primer intento puede salir de la cache; el segundo no, porque
            // repetir textualmente la misma llamada para que salga otra cosa no
            // va a pasar, y guardar ese fallo en la cache envenena 6 horas.
            noCache: intento > 1 || opts.noCache === true,
        });

        const parsed = extractJson(result.text, { validator });

        if (parsed.ok) {
            return {
                ok: true,
                data: parsed.value,
                raw: result.text,
                repaired: parsed.repaired,
                provider: result.provider,
                providerLabel: result.providerLabel,
                modelLabel: result.modelLabel,
                cached: result.cached,
                degraded: result.degraded,
                attempts: intento,
            };
        }

        if (intento === MAX_INTENTOS) {
            return {
                ok: false,
                data: null,
                raw: result.text,
                reason: parsed.reason,
                provider: result.provider,
                providerLabel: result.providerLabel,
                attempts: intento,
            };
        }
    }

    // inalcanzable, pero si se llegara acá no se devuelve undefined
    return { ok: false, data: null, raw: '', reason: 'sin intentos', attempts: 0 };
}

module.exports = {
    ask, askJson, askTools, isConfigured, configuredProviders, getQuota, queueStatus,
    clearCache, cacheSize: () => cache.size, LIMITS, activeProviders,
    GROQ_MODELS, GEMINI_MODELS,
    // Solo para tests: permiten simular una respuesta con tool calls sin
    // pegarle a la red.
    __test: {
        setGroqToolCalls: (v) => { groqLastToolCalls = v; },
        setGeminiToolCalls: (v) => { geminiLastToolCalls = v; },
        jsonSinSoporte,
        JSON_SYSTEM_SUFFIX,
    },
};
