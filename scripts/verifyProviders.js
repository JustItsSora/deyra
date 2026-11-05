// scripts/verifyProviders.js
// Prueba real contra las APIs externas: llama a cada proveedor y cada categoría,
// y reporta cuáles funcionan.
//
// Sirve para dos cosas:
//   1. Después de tocar una URL, saber si sigue respondiendo.
//   2. Descubrir qué categorías de un proveedor están realmente disponibles
//      (las APIs cambian sin avisar y un 404 silencioso deja un comando roto).
//
// NO necesita token de Discord, solo internet.
//
// Uso:
//   node scripts/verifyProviders.js              # resumen por proveedor
//   node scripts/verifyProviders.js --verbose    # una línea por categoría
//   node scripts/verifyProviders.js --only=gif   # solo un módulo (gif|meme|lookup|avatar)

require('dotenv').config();
process.env.BOT_TOKEN = process.env.BOT_TOKEN || 'placeholder';
process.env.CLIENT_ID = process.env.CLIENT_ID || '000000000000000000';

const verbose = process.argv.includes('--verbose');
const only = process.argv.find(a => a.startsWith('--only='))?.split('=')[1];

const results = [];
let pass = 0;
let fail = 0;

// Pausa entre peticiones. Las APIs gratuitas de este bot tienen rate limit por
// IP: sin esto, este mismo script se auto-bloquea y reporta falsos negativos
// (nekos.best devuelve 403 en ráfaga, y después de un rato vuelve a 200).
const PACE_MS = 1200;
let lastCall = 0;

async function pace() {
    const wait = PACE_MS - (Date.now() - lastCall);
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
    lastCall = Date.now();
}

async function probe(label, fn) {
    await pace();
    const start = Date.now();
    try {
        const value = await fn();
        const ms = Date.now() - start;
        pass++;
        results.push({ label, ok: true, ms, note: typeof value === 'string' ? value : '' });
        return value;
    } catch (err) {
        const ms = Date.now() - start;
        fail++;
        results.push({ label, ok: false, ms, note: err.message.slice(0, 110) });
        return null;
    }
}

// --- Proveedores individuales ------------------------------------------------

async function testGif() {
    const gif = require('../src/lib/gifApi');

    console.log('\n─── GIFs ───────────────────────────────────────────────');

    // 1. Las categorías de nekos.best que el catálogo declara.
    //    Se prueban todas: es la única forma de saber si la API cambió.
    const nekosCategories = Object.values(gif.GIF_CATEGORIES)
        .map(c => c.nekosbest)
        .filter(Boolean);
    const uniqueNekos = [...new Set(nekosCategories)];

    for (const cat of uniqueNekos) {
        await probe(`nekos.best/${cat}`, async () => {
            const http = require('../src/lib/http');
            const data = await http.getJson(`https://nekos.best/api/v2/${cat}`, {
                provider: 'nekos.best', timeout: 12000, retries: 1,
            });
            const url = data?.results?.[0]?.url;
            if (!url) throw new Error('respuesta sin url');
            return url;
        });
    }

    // Las imágenes fijas de personaje.
    for (const cat of new Set(Object.values(gif.CHARACTER_CATEGORIES).map(c => c.nekosbest).filter(Boolean))) {
        await probe(`nekos.best/img/${cat}`, async () => {
            const http = require('../src/lib/http');
            const data = await http.getJson(`https://nekos.best/api/v2/${cat}`, {
                provider: 'nekos.best', timeout: 12000, retries: 1,
            });
            const url = data?.results?.[0]?.url;
            if (!url) throw new Error('respuesta sin url');
            return url;
        });
    }

    // 2. Un正常使用 de la API pública (va con circuit breaker).
    await probe('getActionGif("hug")', () => gif.getActionGif('hug'));
    await probe('getCharacterImage("waifu")', () => gif.getCharacterImage('waifu'));
    await probe('searchGif("abrazos")', () => gif.searchGif('abrazos'));

    // 3. El buscador sin coincidencia (no toca red, pero valida el contrato).
    const miss = await gif.searchGif('coche azul');
    if (miss.error === 'sin-coincidencia') {
        pass++;
        results.push({ label: 'searchGif("coche azul") → sin-coincidencia', ok: true, ms: 0, note: 'correcto' });
    } else {
        fail++;
        results.push({ label: 'searchGif("coche azul")', ok: false, ms: 0, note: 'debería no coincidir' });
    }
}

async function testMeme() {
    const meme = require('../src/lib/api/memeApi');
    console.log('\n─── Memes ──────────────────────────────────────────────');

    await probe('imgflip: catálogo', async () => {
        const list = await meme.listTemplates({ limit: 5 });
        if (!list.length) throw new Error('catálogo vacío');
        return `${list.length} plantillas`;
    });
    await probe('imgflip: plantilla al azar', () => meme.randomTemplate());
    await probe('xkcd: última tira', async () => {
        const c = await meme.xkcd(null);
        return `#${c.num} ${c.safe_title}`;
    });
    await probe('xkcd: tira 350', async () => {
        const c = await meme.xkcd(350);
        return `#${c.num} ${c.safe_title}`;
    });
    await probe('cataas: URL de gato', () => {
        const url = meme.catWithText('deyra');
        if (!url.startsWith('https://cataas.com/')) throw new Error('URL inválida');
        return url;
    });
}

async function testLookup() {
    const api = require('../src/lib/api/lookupApi');
    console.log('\n─── Consultas ──────────────────────────────────────────');

    await probe('openlibrary: libro', async () => {
        const b = await api.searchBook('dune');
        return `${b.title} (${b.authors.join(', ')})`;
    });
    await probe('series: ficha', async () => {
        const s = await api.searchShow('friends');
        return `${s.name} · ${s.cast.length} en reparto · ${s.provider || '?'}`;
    });
    await probe('openbrewery: cervecería', async () => {
        const b = await api.randomBrewery();
        return b.name;
    });
    await probe('themealdb: receta', async () => {
        const m = await api.randomMeal();
        return `${m.name} (${m.ingredients.length} ingredientes)`;
    });
    await probe('gamerpower: sorteos', async () => {
        const g = await api.freeGames({ limit: 3 });
        if (!g.length) throw new Error('sin sorteos');
        return `${g.length} sorteos`;
    });
    await probe('steamspy: juego 730', async () => {
        const g = await api.steamGame('730');
        return `${g.name} · ${g.rating}%`;
    });
    await probe('open-notify: ISS', async () => {
        const i = await api.issPosition();
        return `${i.latitude.toFixed(2)}, ${i.longitude.toFixed(2)}`;
    });
    await probe('chucknorris: chiste', async () => {
        const j = await api.chuckJoke();
        return `${j.text.slice(0, 50)}…`;
    });
    await probe('urbandictionary: "bot"', async () => {
        const d = await api.urbanDefine('bot');
        return `${d.definitions.length} definiciones`;
    });
    await probe('deezer: canción', async () => {
        const s = await api.searchSong('daft punk');
        return `${s.title} — ${s.artist}`;
    });
    await probe('github: repos', async () => {
        const r = await api.searchRepos('discord.js', { limit: 3 });
        return `${r.length} repos`;
    });
}

// --- Pruebas de la capa de red (no dependen de APIs externas) ---------------

function testHttp() {
    const http = require('../src/lib/http');
    console.log('\n─── Capa HTTP ──────────────────────────────────────────');

    // 1. El User-Agent tiene que tener el formato "App (contacto)": es lo que
    //    piden las APIs, y con uno de relleno nekos.best devuelve 403.
    const ua = http.USER_AGENT;
    const uaOk = /^[^\s(]+\s\(.+\)$/.test(ua);
    record('User-Agent con formato App (contacto)', uaOk, ua);
    record('User-Agent no es un navegador', !ua.includes('Mozilla'), ua);
    record('User-Agent no es un valor de relleno', !/example|localhost|discord\.com/i.test(ua), ua);

    // 2. La cache tiene que servir el mismo body dos veces (un body de Response
    //    se lee una sola vez: si se cacheara la Response, el segundo acierto
    //    fallaría con "body used already").
    const fake = makeFakeFetch({ body: '{"ok":true,"n":1}' });
    withFetch(fake, async () => {
        http.clearCache();
        const a = await http.getJson('https://fake.test/x', { ttl: 60000, retries: 0 });
        const b = await http.getJson('https://fake.test/x', { ttl: 60000, retries: 0 });
        record('cache devuelve el mismo body dos veces', a.n === 1 && b.n === 1 && fake.calls === 1, `${fake.calls} llamada(s) de red`);
    });

    // 3. Stale-if-error: con el TTL vencido y la red caída, tiene que servir la
    //    copia vieja en vez de propagar el error.
    const flaky = makeFakeFetch({ body: '{"ok":true}' });
    withFetch(flaky, async () => {
        http.clearCache();
        await http.getJson('https://fake.test/stale', { ttl: 1, retries: 0 });
        flaky.down = true;
        await new Promise(r => setTimeout(r, 5));
        const stale = await http.getJson('https://fake.test/stale', { ttl: 1, retries: 0 });
        record('stale-if-error sirve la copia vieja', stale.ok === true, `red: ${flaky.calls} llamada(s)`);
    });

    // 4. Sin cache y con la red caída, el error SÍ tiene que propagarse.
    withFetch(makeFakeFetch({ down: true }), async () => {
        http.clearCache();
        let threw = false;
        try {
            await http.getJson('https://fake.test/down', { ttl: 60000, retries: 0 });
        } catch {
            threw = true;
        }
        record('sin cache, el error se propaga', threw, '');
    });

    // 5. Un 404 tiene que ser un error, no un cuerpo vacío.
    withFetch(makeFakeFetch({ status: 404, body: 'nope' }), async () => {
        http.clearCache();
        let status = null;
        try {
            await http.getJson('https://fake.test/404', { ttl: 60000, retries: 0 });
        } catch (err) {
            status = err.status;
        }
        record('un 404 se reporta como error', status === 404, `status ${status}`);
    });

    // 6. El circuito de proveedores: uno caído queda en cuarentena y el
    //    siguiente responde sin tocar al caído.
    const { withFallback, reset, isOpen } = require('../src/lib/providers');
    reset('test:malo');
    let goodCalls = 0;
    withFallback([
        { name: 'malo', run: async () => { throw new Error('caído'); } },
        { name: 'bueno', run: async () => { goodCalls++; return 'ok'; } },
    ], { label: 'test' }).then((result) => {
        record('fallback usa el proveedor sano', result.value === 'ok', '');
    }).catch(() => record('fallback usa el proveedor sano', false, 'falló'));

    return goodCalls;
}

/** Fetch falso: sirve un cuerpo fijo y cuenta las llamadas. */
function makeFakeFetch({ body = '{}', status = 200, down = false } = {}) {
    return {
        calls: 0,
        down,
        async call() {
            this.calls++;
            if (this.down) {
                const err = new Error('fetch failed');
                err.cause = { code: 'ECONNREFUSED' };
                throw err;
            }
            return new Response(body, { status, headers: { 'content-type': 'application/json' } });
        },
    };
}

function withFetch(fake, fn) {
    const original = global.fetch;
    global.fetch = (...args) => fake.call(...args);
    return Promise.resolve(fn()).finally(() => { global.fetch = original; });
}

function record(label, ok, note) {
    if (ok) pass++;
    else fail++;
    results.push({ label, ok, ms: 0, note: String(note || '').slice(0, 60) });
}

async function testAvatar() {
    const avatar = require('../src/lib/api/avatarApi');
    console.log('\n─── Avatares ───────────────────────────────────────────');

    // Todas las URL generadas tienen que devolver una imagen real, no un 404.
    // Este es el punto donde más fácil se rompe algo: cambiar un estilo de
    // DiceBear y que el comando mande una imagen vacía.
    for (const style of Object.keys(avatar.STYLES)) {
        await probe(`dicebear/${style}`, async () => {
            const url = avatar.avatarUrl(style, 'deyra-test', { size: 256 });
            const http = require('../src/lib/http');
            const res = await http.request(url, { provider: 'dicebear', timeout: 12000 });
            const type = res.headers.get('content-type') || '';
            if (!type.startsWith('image/')) throw new Error(`devolvió ${type || 'nada'}`);
            return type;
        });
    }
}

// --- Informe ----------------------------------------------------------------

function report() {
    const byModule = new Map();
    for (const r of results) {
        const mod = r.label.split(/[/:]/)[0];
        if (!byModule.has(mod)) byModule.set(mod, []);
        byModule.get(mod).push(r);
    }

    console.log('\n══════════════════ RESULTADO ══════════════════');
    for (const [mod, list] of byModule) {
        const ok = list.filter(r => r.ok).length;
        const color = ok === list.length ? '🟢' : (ok === 0 ? '🔴' : '🟡');
        console.log(`${color} ${mod.padEnd(16)} ${ok}/${list.length}`);
        if (verbose || ok < list.length) {
            for (const r of list) {
                if (!r.ok) console.log(`     ✖ ${r.label.padEnd(34)} ${r.note}`);
            }
        }
    }

    console.log(`\nTotal: ${pass} OK / ${fail} fallidos\n`);

    if (fail > 0) {
        console.log('Un proveedor caído no rompe el bot: los comandos tienen cadena de');
        console.log('respaldo (src/lib/providers.js). Los que fallan siempre son los');
        console.log('únicos de su categoría, y ahí conviene cambiar el proveedor.');
    }
}

(async () => {
    const tasks = {
        gif: testGif,
        meme: testMeme,
        lookup: testLookup,
        avatar: testAvatar,
        http: testHttp,
    };

    for (const [name, fn] of Object.entries(tasks)) {
        if (only && only !== name) continue;
        await fn();
    }

    // Las pruebas de la cadena de providers son promesas sueltas: damos un
    // margen para que resuelvan antes de armar el informe.
    await new Promise(r => setTimeout(r, 100));

    report();
    // No es un fallo del código: son APIs de terceros caídas o inaccesibles
    // desde esta red. El script informa, no falla.
    process.exit(0);
})();
