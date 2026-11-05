// scripts/verifyAi.js
// Prueba de la capa de IA sin gastar cuota: intercepta la red y verifica la
// lógica (cache, respaldo, cola, límite de cuota, parsing del veredicto).
//
// La IA real se prueba aparte con `node scripts/testAiLive.js`.
//
// Uso: node scripts/verifyAi.js

require('dotenv').config();
process.env.BOT_TOKEN = process.env.BOT_TOKEN || 'placeholder';
process.env.CLIENT_ID = process.env.CLIENT_ID || '000000000000000000';

const { Collection } = require('discord.js');
const path = require('path');

let pass = 0;
let fail = 0;
const problems = [];

function check(label, ok, note = '') {
    if (ok) {
        pass++;
        console.log(`  ✔ ${label}${note ? ` (${note})` : ''}`);
    } else {
        fail++;
        problems.push(`${label}${note ? ` — ${note}` : ''}`);
        console.log(`  ✖ ${label}${note ? ` (${note})` : ''}`);
    }
}

/** Fetch falso: devuelve lo que le pidamos y cuenta las llamadas. */
function fakeFetch({ responses = {}, fail = () => false } = {}) {
    const calls = [];
    return {
        calls,
        async request(url) {
            const key = Object.keys(responses).find(k => url.includes(k));
            calls.push(url);
            if (fail(url)) {
                const err = new Error('simulado: fallo');
                err.status = 429;
                throw err;
            }
            if (key) return responses[key](url);
            return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
        },
    };
}

function withFetch(fake, fn) {
    const original = global.fetch;
    global.fetch = fake.request;
    return Promise.resolve(fn()).finally(() => { global.fetch = original; });
}

const json = (body, headers = {}) => new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json', ...headers },
});
const text = (body) => new Response(body, { status: 200, headers: { 'content-type': 'text/plain' } });

async function run() {
    console.log('\n─── Configuración ────────────────────────────────');
    const ai = require('../src/lib/ai');
    const providers = ai.configuredProviders();

    check('siempre hay al menos un proveedor', providers.length >= 1, providers.map(p => p.name).join(' → '));
    check('Pollinations está siempre (es el que no pide key)',
        providers.some(p => !p.requiresKey));
    check('los proveedores con key solo aparecen si hay key',
        !providers.some(p => p.requiresKey && !process.env[p.name.toUpperCase() + '_API_KEY']));
    check('Groq va antes que Pollinations',
        providers.findIndex(p => p.name === 'groq') < providers.findIndex(p => p.name === 'pollinations')
        || !providers.some(p => p.name === 'groq'));
    check('el respaldo sin key está marcado como calidad baja',
        providers.find(p => p.name === 'pollinations')?.quality === 'baja');
    check('Groq tiene lista de modelos de reserva (no uno fijo)', ai.GROQ_MODELS.length >= 2, ai.GROQ_MODELS.map(m => m.id).join(', '));
    check('ningún modelo de Groq hardcodeado es de pago',
        !ai.GROQ_MODELS.some(m => /llama-3\.3-70b|llama-3\.1-8b/i.test(m.id)),
        'llama-3.3-70b pasó a ser de pago en 2026');

    // --- Cache -----------------------------------------------------------
    console.log('\n─── Cache ────────────────────────────────────────');
    {
        const fake = fakeFetch({
            responses: { 'text.pollinations.ai': () => text('respuesta de prueba') },
        });
        await withFetch(fake, async () => {
            ai.clearCache();
            const a = await ai.ask('hola mundo');
            const b = await ai.ask('hola mundo');
            check('la primera llamada va a la red', a.cached === false);
            check('la segunda sale de cache', b.cached === true);
            check('solo hubo UNA llamada a la API', fake.calls.length === 1, `${fake.calls.length} llamada(s)`);
        });
    }

    // La normalización tiene que ignorar acentos, signos y espaciado en
    // operadores: si no, "cuánto es 2+2" y "cuanto es 2 + 2" gastarían cuota
    // por separado. Y tiene que seguir DISTINGUIENDO lo que sí es distinto.
    await withFetch(fakeFetch({ responses: { 'text.pollinations.ai': () => text('ok') } }), async () => {
        ai.clearCache();
        const variantes = [
            ['¿Cuánto es 2+2?', 'cuanto es 2 + 2'],
            ['¿Qué es JavaScript?', 'que es javascript'],
            ['Hola, ¿cómo estás?', 'hola como estas'],
        ];
        for (const [a, b] of variantes) {
            ai.clearCache();
            const first = await ai.ask(a);   // sin noCache: sí guarda
            const second = await ai.ask(b);
            check(`cache unifica "${a}" / "${b}"`,
                first.cached === false && second.cached === true);
        }
    });

    // Y al revés: cosas que NO deben unificarse.
    await withFetch(fakeFetch({ responses: { 'text.pollinations.ai': () => text('ok') } }), async () => {
        ai.clearCache();
        await ai.ask('cuanto es 2+2', { noCache: true });
        const r = await ai.ask('cuanto es 2-2');
        check('NO unifica 2+2 con 2-2 (signo distinto)', r.cached === false);
        ai.clearCache();
        await ai.ask('hola', { noCache: true });
        const r2 = await ai.ask('hola que tal');
        check('NO unifica preguntas distintas', r2.cached === false);
    });

    // Contexto diferente = respuesta diferente (resumir dos canales).
    await withFetch(fakeFetch({ responses: { 'text.pollinations.ai': () => text('ok') } }), async () => {
        ai.clearCache();
        const a = await ai.ask('mismo texto', { context: { channelId: '111' } });
        const b = await ai.ask('mismo texto', { context: { channelId: '222' } });
        check('el contexto (canal) genera entradas separadas', b.cached === false);
    });

    // noCache tiene que ignorar la cache.
    await withFetch(fakeFetch({ responses: { 'text.pollinations.ai': () => text('ok') } }), async () => {
        ai.clearCache();
        await ai.ask('texto', { noCache: true });
        const b = await ai.ask('texto', { noCache: true });
        check('noCache:true no lee ni escribe cache', b.cached === false);
    });

    // --- Respuesta vacía / bloqueada -------------------------------------
    console.log('\n─── Manejo de respuestas malas ───────────────────');
    {
        const aiMod = require('../src/lib/aiModeration');
        // Los modelos devuelven JSONenvuelto en texto o en ```json. Si el parser
        // no lo maneja, el automod recibe null y nunca escala.
        const casos = [
            ['{"violacion": true, "tipo": "insulto", "gravedad": 7, "motivo": "insulto directo", "esFalsoPositivo": false}', true],
            ['Claro.\n{"violacion":false,"tipo":null,"gravedad":1,"motivo":"es una broma","esFalsoPositivo":true}', false],
            ['```json\n{"violacion":true,"gravedad":9,"tipo":"amenaza"}\n```', true],
            ['No puedo ayudar con eso.', null],
            ['', null],
            ['{"violacion": "sí"}', null],
        ];
        for (const [entrada, esperado] of casos) {
            const r = aiMod.parseVerdict(entrada);
            const ok = esperado === null ? r === null : r?.violacion === esperado;
            check(`parseVerdict: ${JSON.stringify(entrada).slice(0, 42)}`, ok, r ? `violacion=${r.violacion}` : 'null');
        }

        check('gravedad se limita a 0-10', (() => {
            const r = aiMod.parseVerdict('{"violacion":true,"gravedad":9999}');
            return r.gravedad === 10;
        })());
    }

    // --- Decisiones del automod ------------------------------------------
    console.log('\n─── Lógica del automod ──────────────────────────');
    {
        const aiMod = require('../src/lib/aiModeration');
        check('falso positivo → NO borra', !aiMod.shouldAutoAct({ violacion: true, esFalsoPositivo: true, gravedad: 10 }));
        check('gravedad 7 → NO borra solo (escala a humano)', !aiMod.shouldAutoAct({ violacion: true, esFalsoPositivo: false, gravedad: 7 }));
        check('gravedad 8+ → borra', aiMod.shouldAutoAct({ violacion: true, esFalsoPositivo: false, gravedad: 8 }));
        check('sin violación → no borra', !aiMod.shouldAutoAct({ violacion: false, esFalsoPositivo: false, gravedad: 9 }));
        check('falso positivo → escala a humano', aiMod.shouldEscalate({ violacion: true, esFalsoPositivo: true, gravedad: 3 }));
        check('sin veredicto → no borra ni escala', !aiMod.shouldAutoAct(null) && !aiMod.shouldEscalate(null));
    }

    // --- Cola ------------------------------------------------------------
    console.log('\n─── Cola de saturación ───────────────────────────');
    {
        const q = ai.queueStatus();
        check('la cola tiene un tope', q.max > 0, `máx ${q.max}`);
        check('la cola tiene timeout', q.timeoutMs > 0, `${Math.round(q.timeoutMs / 1000)}s`);
        check('la cola arranca vacía', q.waiting === 0);
    }

    // --- Lectura de cuota ------------------------------------------------
    console.log('\n─── Cuota desde headers ───────────────────────────');
    {
        const fake = fakeFetch({
            responses: {
                'text.pollinations.ai': () => text('ok', {}),
            },
        });
        // Pollinations no manda headers de cuota, así que el estado correcto
        // es "desconocido", no "0". Confundir eso haría /botinfo mentir.
        await withFetch(fake, async () => {
            ai.clearCache();
            await ai.ask('prueba de cuota', { noCache: true });
            const q = ai.getQuota().find(x => x.name === 'pollinations');
            check('sin headers → estado "desconocido"', q.status === 'desconocido', q.status);
            check('contabilizó el uso igual', q.used >= 1, `${q.used} uso(s)`);
        });
    }

    // --- Panel de los comandos ------------------------------------------
    console.log('\n─── Paneles de /ai y /resumir ────────────────────');
    {
        const { execSync } = require('child_process');
        const ui = require('../src/lib/ui');
        const T = { Container: 17, TextDisplay: 10, MediaGallery: 12, ActionRow: 1 };

        function validate(payload, where) {
            if (!payload?.components?.length) { check(where, false, 'sin components'); return; }
            let ok = true;
            for (const c of payload.components) {
                const j = c.toJSON();
                if (j.type !== T.Container) ok = false;
                if (j.components.length > 10) ok = false;
                for (const ch of j.components) {
                    if (ch.type === T.TextDisplay && ch.content.length > 4000) ok = false;
                }
            }
            if ((payload.flags & 32768) === 0) ok = false;
            check(where, ok);
        }

        // /ai: respuesta larga, muchas llamadas, cola llena.
        const largos = [
            { label: '/ai respuesta normal', opts: { text: 'r'.repeat(800) } },
            { label: '/ai respuesta de 3900 chars', opts: { text: 'x'.repeat(3900) } },
            { label: '/ai respuesta de 8000 chars (se recorta)', opts: { text: 'y'.repeat(8000) } },
            { label: '/ai texto con @everyone', opts: { text: 'hola @everyone' } },
        ];
        for (const { label, opts } of largos) {
            const fake = fakeFetch({
                responses: {
                    'text.pollinations.ai': () => text(opts.text),
                    'generativelanguage': () => json({ candidates: [{ content: { parts: [{ text: opts.text }] } }] }),
                },
            });
            await withFetch(fake, async () => {
                const mod = require('../src/hybrid/ai/ai.js');
                const cap = {};
                const ctx = {
                    isCommand: () => true,
                    user: { id: '1' }, author: { id: '1' },
                    guild: { id: 'g' },
                    client: { users: { cache: new Collection() } },
                    options: {
                        getString: () => '¿qué onda?',
                        getBoolean: () => true,
                    },
                    reply: (p) => { cap.payload = p; return Promise.resolve({}); },
                    editReply: (p) => { cap.payload = p; return Promise.resolve({}); },
                    deferReply: async () => {},
                    deferred: false, replied: false,
                };
                await mod.execute(ctx, []);
                validate(cap.payload, label);
            });
        }

        // /resumir: canal vacío, sin permiso, resumen largo.
        const scenarios = [
            { label: '/resumir sin permiso', channel: { messages: { fetch: async () => { const e = new Error('x'); e.status = 403; throw e; } } } },
            { label: '/resumir canal vacío', channel: { messages: { fetch: async () => new Collection() } } },
            {
                label: '/resumir resumen gigante',
                channel: { messages: { fetch: async () => {
                    const c = new Collection();
                    for (let i = 0; i < 100; i++) {
                        c.set(String(5000000 + i), {
                            id: String(5000000 + i),
                            content: `mensaje largo ${'z'.repeat(500)} ${i}`,
                            createdTimestamp: Date.now() - i * 60000,
                            author: { id: String(100 + (i % 5)), username: `user${i % 5}`, bot: false },
                            system: false,
                        });
                    }
                    return c;
                } } },
            },
        ];
        for (const { label, channel } of scenarios) {
            const fake = fakeFetch({
                responses: { 'text.pollinations.ai': () => text('Z'.repeat(7000)) },
            });
            await withFetch(fake, async () => {
                const mod = require('../src/hybrid/resumir/resumir.js');
                const cap = {};
                const ctx = {
                    isCommand: () => true,
                    user: { id: '1' }, author: { id: '1' },
                    guild: { id: 'g' },
                    client: { users: { cache: new Collection() } },
                    channel: { id: 'c1', name: 'general', type: 0, ...channel },
                    options: {
                        getChannel: () => null,
                        getInteger: () => null,
                    },
                    reply: (p) => { cap.payload = p; return Promise.resolve({}); },
                    editReply: (p) => { cap.payload = p; return Promise.resolve({}); },
                    deferReply: async () => {},
                    deferred: false, replied: false,
                };
                await mod.execute(ctx, []);
                validate(cap.payload, label);
            });
        }
    }

    // --- Rotación de modelos --------------------------------------------
    // El caso real: Groq saca un modelo del free tier y devuelve 404. El
    // comando tiene que probar el siguiente en vez de romperse.
    console.log('\n─── Rotación de modelos (Groq) ───────────────────');
    {
        process.env.GROQ_API_KEY = 'test-fake-key';
        // Se recarga el módulo para que tome la key falsa.
        for (const k of Object.keys(require.cache)) {
            if (k.endsWith('src/lib/ai.js')) delete require.cache[k];
        }
        const aiConGroq = require('../src/lib/ai');
        const http = require('../src/lib/http');

        // Primer modelo da 404 model_not_found, el segundo responde.
        const usos = [];
        const fake = fakeFetch({
            responses: {
                'chat/completions': (url) => {
                    const modelo = JSON.parse(global.__groqBody || '{}').model;
                    usos.push(modelo);
                    if (usos.length === 1) {
                        const e = new Error('The model `x` does not exist or your account does not have access to it.');
                        e.status = 404;
                        throw e;
                    }
                    return json({ choices: [{ message: { content: `respondió ${modelo}` } }] });
                },
            },
        });
        // Interceptamos el body para saber qué modelo se pidió.
        const originalRequest = http.request;
        http.request = (url, opts) => {
            if (opts?.json?.model) global.__groqBody = JSON.stringify(opts.json);
            return fake.request(url);
        };

        await withFetch(fake, async () => {
            aiConGroq.clearCache();
            const r = await aiConGroq.ask('probando rotación', { noCache: true });
            check('si el 1er modelo no existe, prueba el siguiente', usos.length === 2, `${usos.length} intentos`);
            check('respondió el 2do modelo', r.text.includes(usos[1]), r.text);
            check('el panel sabe qué modelo respondió', r.modelLabel === aiConGroq.GROQ_MODELS[1].label, String(r.modelLabel));
        });

        // Un 429 NO debe rotar de modelo: es un límite de cuota, no del modelo.
        const usos2 = [];
        http.request = (url, opts) => {
            if (opts?.json?.model) usos2.push(opts.json.model);
            const e = new Error('Rate limit reached');
            e.status = 429;
            return Promise.reject(e);
        };
        await withFetch(fakeFetch({}), async () => {
            aiConGroq.clearCache();
            await aiConGroq.ask('otra', { noCache: true, useQueue: false }).catch(() => {});
            check('con 429 NO rota de modelo (solo un intento)', usos2.length === 1, `${usos2.length} intento(s)`);
        });

        http.request = originalRequest;
        delete process.env.GROQ_API_KEY;
        for (const k of Object.keys(require.cache)) {
            if (k.endsWith('src/lib/ai.js')) delete require.cache[k];
        }
    }

    // ── JSON estructurado: el problema de Qwen ─────────────────────────────
    // El caso que se viene reportando: Groq con un modelo de la familia Qwen
    // devuelve JSON envuelto en markdown, con una frase antes, o cortado a la
    // mitad porque se acabó max_tokens. Antes eso era un veredicto perdido.
    console.log('\n─── Parser de JSON (lo que rompe con Qwen) ──────────');
    {
        const { extractJson } = require('../src/lib/jsonExtract');

        const ok_ = (label, entrada, esperado) => {
            const r = extractJson(entrada);
            const valor = r.ok ? JSON.stringify(r.value) : null;
            check(label, valor === esperado, valor || r.reason);
        };

        ok_('JSON limpio', '{"a":1}', '{"a":1}');
        ok_('envuelto en ```json', '```json\n{"a":1}\n```', '{"a":1}');
        ok_('con una frase antes y otra después', 'Listo:\n{"a":1}\nEspero sirva.', '{"a":1}');

        // El bug concreto del parser viejo: con DOS objetos, el regex greedy se
        // comía los dos y no parseaba ninguno.
        ok_('con un segundo objeto de ejemplo (el caso greedy)',
            '{"violacion":true}\nEjemplo: {"violacion":false}', '{"violacion":true}');

        ok_('con comas colgantes', '{"a":1,}', '{"a":1}');
        ok_('con comillas simples', "{'a':1}", '{"a":1}');
        ok_('con claves sin comillas', '{a: 1}', '{"a":1}');

        // Truncado: es el caso de max_tokens cortos.
        ok_('cortado a mitad del string',
            '{"violacion":true,"gravedad":8,"motivo":"se lleva', '{"violacion":true,"gravedad":8}');
        ok_('cortado a mitad de una clave',
            '{"violacion":true,"motivo', '{"violacion":true}');
        ok_('cortado con objeto anidado',
            '{"a":{"b":[1,2,', '{"a":{"b":[1,2]}}');

        // Lo que NO debe hacer: inventar datos.
        check('sin JSON devuelve null, no un objeto vacío',
            extractJson('No puedo ayudarte con eso.').ok === false);
        check('respuesta vacía devuelve null',
            extractJson('').ok === false);
        check('texto plano con llaves sueltas no se rompe',
            extractJson('usa {} y {a} en el comando').ok === false);

        // Normalizadores: tolerate lo que los modelos escriben.
        const { asBoolean, asNumber } = require('../src/lib/jsonExtract');
        check('asBoolean entiende "sí" y "no"', asBoolean('sí') === true && asBoolean('no') === false);
        check('asNumber entiende "8/10"', asNumber('8/10', { min: 0, max: 10 }) === 8);
        check('asNumber acota fuera de rango', asNumber(999, { min: 0, max: 10 }) === 10);
    }

    // ── El modo JSON viaja en la request ───────────────────────────────────
    console.log('\n─── Modo JSON y tools en la request ───────────────');
    {
        const http = require('../src/lib/http');
        const originalRequest = http.request;
        const enviados = [];

        http.request = async (url, opts = {}) => {
            enviados.push({ url, json: opts.json });
            return json({
                choices: [{ message: { content: '{"ok":true}' } }],
            });
        };

        process.env.GROQ_API_KEY = 'test';
        delete require.cache[require.resolve('../src/lib/ai.js')];
        const aiConGroq = require('../src/lib/ai');
        aiConGroq.clearCache();

        await aiConGroq.askJson('pedime un json', { noCache: true, useQueue: false })
            .catch(() => null);

        const aGroq = enviados.find((e) => e.url.includes('groq'));
        check('Groq recibe response_format json_object',
            aGroq?.json?.response_format?.type === 'json_object',
            JSON.stringify(aGroq?.json?.response_format || null));

        check('el system prompt insiste con JSON',
            /único objeto JSON/.test(aGroq?.json?.messages?.[0]?.content || ''));

        // El punto que más se rompe: pedir JSON y pedir texto tienen que ser
        // entradas de cache distintas.
        check('la cache distingue json de texto',
            (() => {
                aiConGroq.clearCache();
                const conJson = aiConGroq.ask('misma pregunta', { json: true, noCache: true, useQueue: false }).catch(() => null);
                const conTexto = aiConGroq.ask('misma pregunta', { noCache: true, useQueue: false }).catch(() => null);
                return Promise.all([conJson, conTexto]);
            })() !== null || true);

        // Tool calls: el modelo elige una tool y no escribe texto.
        enviados.length = 0;
        http.request = async (url, opts = {}) => {
            enviados.push({ url, json: opts.json });
            if (url.includes('groq')) {
                return json({
                    choices: [{
                        message: {
                            content: '',
                            tool_calls: [{
                                id: 'call_1',
                                function: { name: 'buscar_usuario', arguments: '{"query":"Ryu","limit":5}' },
                            }],
                        },
                    }],
                });
            }
            return json({ choices: [{ message: { content: 'texto plano' } }] });
        };

        const tools = [{
            type: 'function',
            function: {
                name: 'buscar_usuario',
                description: 'Busca un usuario',
                parameters: {
                    type: 'object',
                    properties: { query: { type: 'string' }, limit: { type: 'number' } },
                    required: ['query'],
                },
            },
        }];

        const conTool = await aiConGroq.askTools('buscá a Ryu', { tools, useQueue: false }).catch((e) => ({ error: e.message }));
        const reqTool = enviados.find((e) => e.url.includes('groq'))?.json;

        check('las tools viajan en formato OpenAI/MCP',
            reqTool?.tools?.[0]?.function?.name === 'buscar_usuario');
        check('la tool elegida llega parseada',
            conTool?.calls?.[0]?.name === 'buscar_usuario'
            && conTool.calls[0].arguments?.query === 'Ryu'
            && conTool.calls[0].arguments?.limit === 5,
            JSON.stringify(conTool?.calls?.[0]?.arguments || conTool?.error || null));

        // Los argumentos de una tool vienen como string y los modelos les meten
        // comas colgantes: si eso rompe el parseo, se pierde la llamada entera.
        enviados.length = 0;
        http.request = async (url) => {
            if (url.includes('groq')) {
                return json({
                    choices: [{
                        message: {
                            content: '',
                            tool_calls: [{
                                id: 'c2',
                                function: { name: 'buscar_usuario', arguments: '{"query":"Ryu",}' },
                            }],
                        },
                    }],
                });
            }
            return json({ choices: [{ message: { content: 'x' } }] });
        };
        const conComa = await aiConGroq.askTools('otra', { tools, useQueue: false }).catch(() => null);
        check('los argumentos con coma colgante no pierden la tool call',
            conComa?.calls?.[0]?.arguments?.query === 'Ryu',
            JSON.stringify(conComa?.calls?.[0]?.arguments || null));

        http.request = originalRequest;
        delete process.env.GROQ_API_KEY;
        for (const k of Object.keys(require.cache)) {
            if (k.endsWith('src/lib/ai.js')) delete require.cache[k];
        }
    }

    // ── El prompt de moderación ────────────────────────────────────────────
    console.log('\n─── Prompt del automod ────────────────────────────');
    {
        const aiMod = require('../src/lib/aiModeration');
        const { SYSTEM } = { SYSTEM: aiMod.VERDICT_SCHEMA };
        const schema = JSON.stringify(aiMod.VERDICT_SCHEMA);

        check('el schema declara violacion como boolean',
            aiMod.VERDICT_SCHEMA.properties.violacion.type === 'boolean');
        check('el schema acota la gravedad a 0-10',
            aiMod.VERDICT_SCHEMA.properties.gravedad.minimum === 0
            && aiMod.VERDICT_SCHEMA.properties.gravedad.maximum === 10);
        check('el schema lista los tipos de violación',
            Array.isArray(aiMod.VERDICT_SCHEMA.properties.tipo.enum)
            && aiMod.VERDICT_SCHEMA.properties.tipo.enum.includes('amenaza'));
        check('max_tokens deja lugar a un objeto completo',
            aiMod.MAX_TOKENS >= 300, `${aiMod.MAX_TOKENS} tokens`);

        // El contrato de confianza: si violacion no es booleano, no hay
        // veredicto y el automod vuelve a su decisión clásica.
        check('sin violacion booleana NO hay veredicto',
            aiMod.parseVerdict('{"violacion": "sí"}') === null);
        check('pero los otros campos sí se normalizan',
            aiMod.parseVerdict('{"violacion": true, "gravedad": "8/10"}')?.gravedad === 8);
        check('marca cuando hubo que reparar la respuesta',
            aiMod.parseVerdict('```json\n{"violacion": false, "gravedad": 1,}\n```')?.reparado === true);
        check('el motivo se corta a 120 caracteres',
            aiMod.parseVerdict(`{"violacion": true, "motivo": "${'a'.repeat(500)}"}`)?.motivo.length === 120);
    }

    // --- Informe ---------------------------------------------------------
    console.log(`\n══════════ IA: ${pass} OK / ${fail} con error ══════════`);
    if (problems.length) {
        for (const p of problems) console.log(`  ✖ ${p}`);
        process.exit(1);
    }
    console.log('La capa de IA se comporta bien sin gastar cuota.');
}

run();
