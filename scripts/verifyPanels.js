// scripts/verifyPanels.js
// Prueba de integración de los paneles: arma los payloads de los comandos que
// cambiaron y valida el JSON contra los límites reales de Discord.
//
// No necesita token ni conexión: los comandos se invocan con un `ctx` falso que
// devuelve datos de ejemplo, y las llamadas a APIs externas se simulan.
//
// Uso: node scripts/verifyPanels.js

require('dotenv').config();
process.env.BOT_TOKEN = process.env.BOT_TOKEN || 'placeholder';
process.env.CLIENT_ID = process.env.CLIENT_ID || '000000000000000000';

const { Collection } = require('discord.js');
const path = require('path');
const { loadHybridCommands } = require('../src/lib/commandLoader');
const ui = require('../src/lib/ui');

let pass = 0;
let fail = 0;
const problems = [];

const T = { ActionRow: 1, Section: 9, TextDisplay: 10, MediaGallery: 12, Container: 17 };

/** Valida un payload {components, flags} como lo haría Discord. */
function validate(payload, where) {
    if (!payload || !Array.isArray(payload.components) || !payload.components.length) {
        problems.push(`${where}: payload sin components`);
        return false;
    }
    if (payload.components.length > 40) problems.push(`${where}: ${payload.components.length} containers (>40)`);
    if ((payload.flags & 32768) === 0) problems.push(`${where}: falta IsComponentsV2`);
    if (payload.content) problems.push(`${where}: usa content con ComponentsV2`);

    for (const container of payload.components) {
        const json = typeof container.toJSON === 'function' ? container.toJSON() : container;
        if (json.type !== T.Container) {
            problems.push(`${where}: no es Container (type ${json.type})`);
            continue;
        }
        if (json.components.length > 10) {
            problems.push(`${where}: container con ${json.components.length} hijos (>10)`);
        }
        for (const child of json.components) {
            if (child.type === T.TextDisplay && child.content.length > 4000) {
                problems.push(`${where}: TextDisplay de ${child.content.length} chars`);
            }
            if (child.type === T.MediaGallery && child.items.length > 10) {
                problems.push(`${where}: galería de ${child.items.length} (>10)`);
            }
            if (child.type === T.ActionRow && child.components.length > 5) {
                problems.push(`${where}: fila con ${child.components.length} botones`);
            }
            if (child.type === T.Section && !child.accessory) {
                problems.push(`${where}: section sin accesorio`);
            }
        }
    }
    return true;
}

async function check(name, fn) {
    try {
        const result = await fn();
        if (!result) {
            problems.push(`${name}: no devolvió payload`);
            fail++;
            return;
        }
        if (validate(result, name)) pass++;
        else fail++;
    } catch (err) {
        problems.push(`${name}: lanzó ${err.message}`);
        fail++;
    }
}

// --- Mocks ------------------------------------------------------------------

const now = Date.now();
const fakeUser = {
    id: '111111111111111111',
    username: 'Ryu',
    tag: 'Ryu#0001',
    bot: false,
    createdTimestamp: now - 400 * 86400000,
    displayAvatarURL: () => 'https://cdn.discordapp.com/embed/avatars/1.png',
    toString: () => '<@111111111111111111>',
};

const fakeMember = {
    id: fakeUser.id,
    user: fakeUser,
    nickname: 'Ryu',
    joinedTimestamp: now - 200 * 86400000,
    manageable: true,
    presence: { status: 'online', activities: [{ type: 0, name: 'Deyra' }] },
    // Colección real de discord.js: filter/sort/map/slice se comportan igual
    // que en producción, así el mock no tapa bugs del comando.
    roles: {
        cache: new Collection([
            ['r1', { id: 'r1', toString: () => '@Admin', position: 3, managed: false }],
            ['r2', { id: 'r2', toString: () => '@Miembro', position: 1, managed: false }],
        ]),
    },
    permissions: { has: () => false },
};

const fakeChannel = {
    type: 0,
    name: 'general',
    id: '222222222222222222',
};

const fakeGuild = {
    id: '333333333333333333',
    name: 'Deyraland',
    description: 'El mejor servidor de prueba',
    createdTimestamp: now - 900 * 86400000,
    memberCount: 1284,
    premiumTier: 2,
    premiumSubscriptionCount: 14,
    ownerId: '444444444444444444',
    iconURL: () => 'https://cdn.discordapp.com/icons/1/a.png',
    verificationLevel: 1,
    explicitContentFilter: 1,
    channels: { cache: new Collection() },
    emojis: { cache: new Collection() },
    stickers: { cache: new Collection() },
    roles: { cache: new Collection() },
    members: { cache: new Collection(), me: { joinedTimestamp: now - 100 * 86400000 }, fetch: async () => fakeMember },
    fetch: async () => {},
    fetchOwner: async () => ({ user: { username: 'Dueño', tag: 'Dueño#0001', toString: () => 'Dueño' } }),
};

// Reproductor falso: los paneles de música se arman a partir de un player de
// Kazagumo, y sin esto no se pueden probar sin un nodo de Lavalink real.
function fakeTrack(overrides = {}) {
    return {
        title: 'Believer — Imagine Dragons',
        author: 'Imagine Dragons',
        uri: 'https://www.youtube.com/watch?v=5m7oJ0nVpz8',
        length: 217000,
        thumbnail: 'https://i.ytimg.com/vi/5m7oJ0nVpz8/maxresdefault.jpg',
        identifier: 'abc123XYZ',
        sourceName: 'youtube',
        requester: { id: '111111111111111111', username: 'Ryu' },
        ...overrides,
    };
}

function fakePlayer(overrides = {}) {
    const data = new Map();
    return {
        guildId: fakeGuild.id,
        voiceId: '999999999999999999',
        textId: fakeChannel.id,
        volume: 80,
        paused: false,
        playing: true,
        loop: 'none',
        position: 42000,
        data,
        queue: { current: fakeTrack(), size: 3, previous: [] },
        shoukaku: { setFilters: async () => {}, clearFilters: async () => {} },
        pause() {}, play: async () => {}, skip() {}, setLoop() {},
        setVolume: async () => {},
        ...overrides,
    };
}

const fakePlayer2 = fakePlayer();

const fakeClient = {
    commands: new Collection(),
    prefixCommands: new Collection(),
    // El módulo de música carga si hay nodos en la config. Se le da un nodo con
    // state 1 (conectado) porque `requireMusic` no se conforma con que el
    // manager exista: mira que haya un nodo RESPONDIENDO. Sin esto los comandos
    // de música cortan todos en el panel de "música no conectada" y el test
    // pasa sin haber probado el panel que quería.
    music: {
        players: new Collection([[fakeGuild.id, fakePlayer2]]),
        shoukaku: {
            nodes: new Collection([['main', { name: 'main', state: 1 }]]),
            nodeResolver: (nodes) => [...nodes.values()].find((n) => n.state === 1) || null,
        },
        search: async () => ({ type: 'SEARCH', tracks: [] }),
    },
    users: { cache: new Collection([[fakeUser.id, fakeUser]]), fetch: async () => fakeUser },
    guilds: { cache: new Collection([[fakeGuild.id, fakeGuild]]) },
    ws: { ping: 42 },
    uptime: 4 * 3600000 + 12345,
    readyTimestamp: now - (4 * 3600000 + 12345),
    user: { tag: 'Deyra#0001', displayAvatarURL: () => 'https://cdn.discordapp.com/embed/avatars/0.png' },
};

loadHybridCommands(fakeClient, path.join(__dirname, '..', 'src', 'hybrid'));

/** Contexto falso que captura el payload en vez de enviarlo. */
function makeCtx(overrides = {}) {
    const captured = {};
    const ctx = {
        isCommand: () => true,
        user: fakeUser,
        member: fakeMember,
        author: fakeUser,
        guild: fakeGuild,
        channel: fakeChannel,
        client: fakeClient,
        options: {
            getString: () => null,
            getInteger: () => null,
            getUser: () => null,
            getBoolean: () => null,
        },
        reply: (payload) => { captured.payload = payload; return Promise.resolve({ edit: async () => {} }); },
        editReply: (payload) => { captured.payload = payload; return Promise.resolve({}); },
        edit: (payload) => { captured.payload = payload; return Promise.resolve({}); },
        deferReply: async () => {},
        ...overrides,
    };
    return { ctx, captured };
}

async function run(name, file, overrides) {
    await check(name, async () => {
        const { ctx, captured } = makeCtx(overrides);
        const mod = require(file);
        await mod.execute(ctx, []);
        return captured.payload;
    });
}

// --- Comandos migrados al sistema nuevo --------------------------------------

(async () => {
    await run('serverinfo', '../src/hybrid/serverinfo/serverinfo.js');
    await run('userinfo', '../src/hybrid/userinfo/userinfo.js');
    await run('botinfo', '../src/hybrid/botinfo/botinfo.js');
    await run('ping', '../src/hybrid/ping/ping.js');
    await run('help', '../src/hybrid/help/help.js');
    await run('nsfw (solo estado)', '../src/hybrid/nsfw/nsfw.js');

    // --- Paneles del módulo de música (etapa 9) -----------------------------
    // Se prueban por los tres caminos que más se rompen: reproduciendo, en
    // pausa y sin nada sonando. Los tres arman el panel con bloques distintos
    // (medidor, línea de estado, y el panel de "no hay nada").
    const { buildPlayerPanel } = require('../src/music/ui/playerPanel');
    const { buildFilterMenu } = require('../src/music/ui/filterMenu');

    await check('música: panel reproduciendo', () => ({
        components: [buildPlayerPanel(fakePlayer())],
        flags: 32768,
    }));

    await check('música: panel en pausa con loop y cola', () => {
        const p = fakePlayer({ paused: true, loop: 'queue' });
        p.data.set('autoplay', true);
        p.data.set('stay247', true);
        p.data.set('fairplay', true);
        p.data.set('filter:active', 'nightcore');
        return { components: [buildPlayerPanel(p)], flags: 32768 };
    });

    await check('música: panel sin canción', () => {
        const p = fakePlayer({ queue: { current: null, size: 0 } });
        return { components: [buildPlayerPanel(p)], flags: 32768 };
    });

    await check('música: panel de pista en vivo (sin duración)', () => {
        const p = fakePlayer();
        p.queue.current = fakeTrack({ length: 0, title: 'Radio en vivo 24/7' });
        return { components: [buildPlayerPanel(p)], flags: 32768 };
    });

    await check('música: menú de filtros página 1', () => {
        const p = fakePlayer();
        p.data.set('filter:active', 'lofi');
        return { components: [buildFilterMenu(p, 1)], flags: 32768 };
    });

    await check('música: menú de filtros sin filtro activo', () => ({
        components: [buildFilterMenu(fakePlayer(), 0)],
        flags: 32768,
    }));

    await run('nowplaying', '../src/hybrid/nowplaying/nowplaying.js');
    await run('twentyfourseven (consulta)', '../src/hybrid/twentyfourseven/twentyfourseven.js');
    await run('premium', '../src/hybrid/premium/premium.js');
    await run('credits', '../src/hybrid/credits/credits.js');
    await run('playlist lista (vacía)', '../src/hybrid/playlist/playlist.js', {
        options: { getSubcommand: () => 'lista', getString: () => null, getInteger: () => null, getBoolean: () => null },
    });
    await run('filter listar', '../src/hybrid/filter/filter.js', {
        options: { getSubcommand: () => 'listar', getString: () => null, getInteger: () => null, getBoolean: () => null },
    });

    // /clear tiene los paneles más cargados del bot (listas + avisos + medidor),
    // así que se prueban los cuatro caminos: permisos, error de uso, sin
    // resultados, simulación y borrado real.
    const clearOpts = (opts) => ({
        options: {
            getString: (n) => opts[n] ?? null,
            getInteger: (n) => (n === 'cantidad' ? opts.cantidad : null),
            getUser: () => (opts.usuario ? { id: '999888777666555444' } : null),
            getBoolean: (n) => (n === 'simular' ? Boolean(opts.simular) : null),
        },
    });

    await check('clear: sin permisos', async () => {
        const { ctx, captured } = makeCtx({
            ...clearOpts({ cantidad: 50 }),
            member: { ...fakeMember, permissions: { has: () => false } },
        });
        await require('../src/hybrid/clear/clear.js').execute(ctx, []);
        return captured.payload;
    });

    await check('clear: cantidad inválida', async () => {
        const { ctx, captured } = makeCtx(clearOpts({ cantidad: 0 }));
        await require('../src/hybrid/clear/clear.js').execute(ctx, []);
        return captured.payload;
    });

    await check('clear: modo usuario sin usuario', async () => {
        const { ctx, captured } = makeCtx(clearOpts({ cantidad: 50, modo: 'usuario' }));
        await require('../src/hybrid/clear/clear.js').execute(ctx, []);
        return captured.payload;
    });

    await check('clear: sin resultados', async () => {
        const { ctx, captured } = makeCtx({
            ...clearOpts({ cantidad: 50, modo: 'bots' }),
            channel: { ...fakeChannel, messages: { fetch: async () => new Collection() } },
        });
        await require('../src/hybrid/clear/clear.js').execute(ctx, []);
        return captured.payload;
    });

    // 100 mensajes de 12 autores distintos, muchos de bots: el caso que más
    // listas y avisos genera.
    await check('clear: simulación con muchos autores', async () => {
        const muchos = new Collection();
        for (let i = 0; i < 100; i++) {
            const authorId = String(1000000 + (i % 12));
            muchos.set(String(3000000 + i), {
                id: String(3000000 + i),
                createdTimestamp: now - i * 60000,
                content: `mensaje ${i}`,
                author: { id: authorId, username: `user${i % 12}`, bot: i % 5 === 0 },
                attachments: { size: 0 },
            });
        }
        const { ctx, captured } = makeCtx({
            ...clearOpts({ cantidad: 2000, modo: 'todos', simular: true }),
            channel: { ...fakeChannel, messages: { fetch: async () => muchos } },
        });
        await require('../src/hybrid/clear/clear.js').execute(ctx, []);
        return captured.payload;
    });

    // La mitad de los mensajes son de OTROS BOTS: Discord los debe saltear y
    // el panel tiene que avisarlo (es el caso que más confunde al usuario).
    await check('clear: borrado real con bots ajenos', async () => {
        const conBots = new Collection();
        for (let i = 0; i < 50; i++) {
            const ajeno = i % 2 === 1;
            conBots.set(String(4000000 + i), {
                id: String(4000000 + i),
                createdTimestamp: now - i * 60000,
                content: `x${i}`,
                author: ajeno
                    ? { id: '555000', username: 'OtroBot', bot: true }
                    : { id: String(4000000 + i), username: `user${i}`, bot: false },
                attachments: { size: 0 },
            });
        }
        const { ctx, captured } = makeCtx({
            ...clearOpts({ cantidad: 50, modo: 'bots' }),
            client: { ...fakeClient, user: { ...fakeClient.user, id: 'MI_ID' } },
            channel: {
                ...fakeChannel,
                messages: { fetch: async () => conBots },
                bulkDelete: async (msgs) => ({ size: msgs.length }),
            },
        });
        await require('../src/hybrid/clear/clear.js').execute(ctx, []);
        return captured.payload;
    });

    // Mensajes viejos (>14 días): el límite de Discord que siempre forgot people.
    await check('clear: todos los mensajes son viejos', async () => {
        const viejos = new Collection();
        for (let i = 0; i < 30; i++) {
            viejos.set(String(5000000 + i), {
                id: String(5000000 + i),
                createdTimestamp: now - (20 * 24 * 60 * 60 * 1000),
                content: `viejo ${i}`,
                author: { id: String(5000000 + i), username: `u${i}`, bot: false },
                attachments: { size: 0 },
            });
        }
        const { ctx, captured } = makeCtx({
            ...clearOpts({ cantidad: 50, modo: 'todos' }),
            channel: { ...fakeChannel, messages: { fetch: async () => viejos } },
        });
        await require('../src/hybrid/clear/clear.js').execute(ctx, []);
        return captured.payload;
    });

    // /help con categoría directa: la paginación y el bloque de código tienen
    // que caber en 10 componentes.
    await check('help con categoría', async () => {
        const { ctx, captured } = makeCtx({
            options: { getString: (n) => (n === 'categoria' ? 'utilidad' : null), getInteger: () => null, getUser: () => null, getBoolean: () => null },
        });
        const mod = require('../src/hybrid/help/help.js');
        await mod.execute(ctx, []);
        return captured.payload;
    });

    // helpView directo, con la categoría más grande del bot (utilidad: ~230).
    await check('helpView categoría grande', async () => {
        const { buildCategoryPage } = require('../src/lib/helpView');
        const byCategory = {};
        for (const command of fakeClient.commands.values()) {
            const cat = command.category || 'utilidad';
            (byCategory[cat] ||= []).push(command);
        }
        const categories = Object.keys(byCategory);
        return buildCategoryPage(byCategory, categories, 'utilidad', 0);
    });

    // Última página de una categoría: el caso donde se suelen romper los límites.
    await check('helpView última página', async () => {
        const { buildCategoryPage } = require('../src/lib/helpView');
        const byCategory = {};
        for (const command of fakeClient.commands.values()) {
            const cat = command.category || 'utilidad';
            (byCategory[cat] ||= []).push(command);
        }
        const categories = Object.keys(byCategory);
        const total = byCategory.utilidad.length;
        const lastPage = Math.ceil(total / 9) - 1;
        return buildCategoryPage(byCategory, categories, 'utilidad', lastPage);
    });

    // --- Acciones sociales: sin objetivo y con objetivo ---
    await check('social sola (spin)', async () => {
        const { executeSocialAction } = require('../src/lib/socialExecutor');
        const { ctx, captured } = makeCtx();
        // Sin red: simulamos que el proveedor falla y se verifica el estado
        // de error, que es el camino que más se rompe.
        const gif = require('../src/lib/gifApi');
        const original = gif.getActionGif;
        gif.getActionGif = async () => ({ url: 'https://nekos.best/a.gif', source: 'nekos.best', anime: 'Test', provider: 'nekos.best' });
        try {
            await executeSocialAction('spin', ctx, []);
        } finally {
            gif.getActionGif = original;
        }
        return captured.payload;
    });

    await check('social dirigida (hug) sin target', async () => {
        const { executeSocialAction } = require('../src/lib/socialExecutor');
        const { ctx, captured } = makeCtx();
        await executeSocialAction('hug', ctx, []);
        return captured.payload;
    });

    // --- Primitivas del sistema de diseño, con inputs hostiles ---
    await check('texto: 20k chars', () => ui.payload({ title: 'x', description: 'a'.repeat(20000), category: 'utilidad' }));
    await check('texto: markdown sin cerrar', () => ui.payload({ title: 'x', description: '**'.repeat(500), category: 'utilidad' }));
    await check('grid: 30 filas', () => ui.payload({ title: 'x', category: 'utilidad', grid: Array.from({ length: 30 }, (_, i) => [`Fila ${i}`, 'v'.repeat(80)]) }));
    await check('grid: claves con acentos y emoji', () => ui.payload({ title: 'x', category: 'utilidad', grid: [['Émoji 🎉', 'a'], ['Chino 中文', 'b'], ['Mixto 🔥🔥', 'c']] }));
    await check('stats: 6 tarjetas', () => ui.payload({ title: 'x', category: 'utilidad', stats: Array.from({ length: 6 }, (_, i) => ({ label: `M${i}`, value: `${i}`.repeat(30) })) }));
    await check('meters: max 0', () => ui.payload({ title: 'x', category: 'niveles', meters: [{ label: 'X', value: 5, max: 0 }] }));
    await check('meters: negativos', () => ui.payload({ title: 'x', category: 'niveles', meters: [{ label: 'X', value: -5, max: 10 }] }));
    await check('media: 25 imágenes', () => ui.payload({ title: 'x', category: 'diversión', media: Array.from({ length: 25 }, (_, i) => `https://e.com/${i}.jpg`) }));
    await check('media: URL inválida', () => ui.payload({ title: 'x', category: 'diversión', media: 'javascript:alert(1)' }));
    await check('media: javascript:', () => ui.payload({ title: 'x', category: 'diversión', media: 'javascript:alert(document.cookie)' }));
    await check('media: data URI', () => ui.payload({ title: 'x', category: 'diversión', media: 'data:text/html,<script>alert(1)</script>' }));
    await check('media: file://', () => ui.payload({ title: 'x', category: 'diversión', media: 'file:///etc/passwd' }));

    // --- Contenido hostil: viene de APIs de terceros, no de código propio ---
    await check('hostil: @everyone en descripción', () => ui.payload({ title: 'x', category: 'diversión', description: 'Hola @everyone y @here' }));
    await check('hostil: @everyone en callout', () => ui.payload({ title: 'x', category: 'diversión', callouts: [{ tone: 'warning', text: 'Cuidado @everyone' }] }));
    await check('hostil: @everyone en lista', () => ui.payload({ title: 'x', category: 'diversión', lists: [{ title: 'L', items: ['@everyone', 'normal'] }] }));
    await check('hostil: @everyone en cita', () => ui.payload({ title: 'x', category: 'diversión', quote: { text: 'oye @everyone', author: 'x' } }));
    await check('hostil: @everyone en pie', () => ui.payload({ title: 'x', category: 'diversión', footerText: 'de @everyone' }));
    await check('hostil: mención real de usuario (debe sobrevivir)', () => ui.payload({ title: 'x', category: 'diversión', description: 'hola <@123456789012345678>' }));
    await check('hostil: 4 listas de 12 items largos', () => ui.payload({
        title: 'x', category: 'diversión',
        lists: Array.from({ length: 4 }, (_, i) => ({ title: `L${i}`, items: Array.from({ length: 12 }, (_, k) => `item ${k} ${'x'.repeat(200)}`) })),
    }));
    await check('hostil: cita de 10k chars', () => ui.payload({ title: 'x', category: 'diversión', quote: { text: 'q'.repeat(10000) } }));

    // Los dos tienen que seguir funcionando (o sea: el saneado no rompe nada).
    await check('sanitize no rompe texto normal', () => {
        const p = ui.payload({ title: 'Normal', category: 'diversión', description: 'Texto **con negrita** y `código` normal.' });
        return p;
    });
    await check('sanitize no rompe grid con 0', () => ui.payload({ title: 'x', category: 'utilidad', grid: [['a', '0'], ['b', '-1'], ['c', '1e10']] }));

    // /embed: los colores que se pasan como entero o hex tienen que respected
    // el acento sin romper nada.
    await check('embed: color entero', () => {
        const { toPanelOptions } = require('../src/hybrid/embed/embed');
        return ui.payload(toPanelOptions({ title: 'x', color: 16711680, description: 'd' }).opts);
    });
    await check('embed: color hex', () => {
        const { toPanelOptions } = require('../src/hybrid/embed/embed');
        return ui.payload(toPanelOptions({ title: 'x', color: '#00ff00' }).opts);
    });
    await check('embed: color basura', () => {
        const { toPanelOptions } = require('../src/hybrid/embed/embed');
        const { opts } = toPanelOptions({ title: 'x', color: 'basura' });
        return ui.payload(opts);
    });
    await check('embed: todo junto', () => {
        const { toPanelOptions } = require('../src/hybrid/embed/embed');
        const { opts } = toPanelOptions({
            title: 'Completo', description: 'd', color: '#123456',
            stats: [{ label: 'A', value: '1' }], grid: [['k', 'v']],
            list: ['a', 'b'], callout: 'n', footer: 'f', image: 'https://e.com/a.png',
            fields: [{ name: 'x', value: 'y' }],
        });
        return ui.payload(opts);
    });
    await check('media: sin protocolo', () => ui.payload({ title: 'x', category: 'diversión', media: 'www.e.com/a.jpg' }));
    await check('lists: 15 items', () => ui.payload({ title: 'x', category: 'utilidad', lists: [{ title: 'L', items: Array.from({ length: 15 }, (_, i) => `item ${i}`) }] }));
    await check('quote largo', () => ui.payload({ title: 'x', category: 'diversión', quote: { text: 'q'.repeat(5000), author: 'a' } }));
    await check('25 botones', () => {
        const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
        const rows = [0, 1, 2, 3, 4].map(i => new ActionRowBuilder().addComponents(...Array.from({ length: 5 }, (_, k) => new ButtonBuilder().setCustomId(`x${i}${k}`).setLabel(`B${i}${k}`).setStyle(ButtonStyle.Secondary))));
        return ui.payload({ title: 'x', category: 'utilidad', rows });
    });

    // --- Errores claros -----------------------------------------------------
    // Los dos bugs que aparecieron en producción: /play tiraba "No node found"
    // (error interno de un framework, no un problema del usuario) y un comando
    // inexistente respondía "Ocurrió un error ejecutando este comando", que no
    // dice absolutamente nada.
    console.log('\n--- Errores claros -------------------------------------------');

    const { errorReport } = require('../src/lib/errorReport');
    const { suggest, levenshtein, similarity } = require('../src/lib/commandSuggest');
    const checks = require('../src/music/lib/musicChecks');
    const canonicales = new Set([...fakeClient.prefixCommands.values()].map(c => c.name));

    // El mensaje crudo de Shoukaku, verbatim.
    const NO_NODE = 'No node found';
    const panel = errorReport('Error', new Error(NO_NODE), '/play');
    if (panel.title !== 'La música no está conectada') {
        problems.push(`errorReport: con "${NO_NODE}" dio "${panel.title}", no el panel de nodo caído`);
        fail++;
    } else if (/No node found/.test(JSON.stringify(panel))) {
        problems.push('errorReport: filtra al usuario el mensaje crudo del framework');
        fail++;
    } else pass++;

    // Un bug interno no puede filtrar la estructura del bot al canal.
    const bug = errorReport('Error', new TypeError("Cannot read properties of undefined (reading 'name')"), '/play');
    if (/undefined|reading|TypeError/.test(JSON.stringify(bug))) {
        problems.push('errorReport: filtra el stack de un bug interno al usuario');
        fail++;
    } else pass++;

    // Un error de Discord accionable SÍ se traduce.
    const api = errorReport('Error', Object.assign(new Error('Missing Permissions'), { code: 50013 }), '/clear');
    if (!/permiso/i.test(api.description)) {
        problems.push('errorReport: el error 50013 de Discord no se traduce');
        fail++;
    } else pass++;

    // El panel de nodo caído tiene que ser un payload válido, no texto suelto.
    for (const [nombre, manager] of [
        ['panel nodo: 1 configurado', { shoukaku: { nodes: { size: 1 } } }],
        ['panel nodo: varios', { shoukaku: { nodes: { size: 3 } } }],
        ['panel nodo: ninguno', { shoukaku: { nodes: { size: 0 } } }],
    ]) {
        await check(nombre, () => ui.payload(checks.noNodePanel(manager)));
    }

    // requireMusic tiene que RECHAZAR cuando el manager existe pero ningún nodo
    // está conectado. Antes solo miraba que existiera el manager, así que
    // pasaba el chequeo y reventaba más adentro con "No node found".
    for (const [nombre, manager, esperado] of [
        ['sin manager', null, false],
        ['manager sin nodos', { shoukaku: { nodes: { size: 0, values: () => [] } } }, false],
        ['nodo desconectado', { shoukaku: { nodes: { size: 1, values: () => [{ state: 3 }] } } }, false],
        ['nodo conectado', { shoukaku: { nodes: { size: 1, values: () => [{ state: 1, name: 'ok' }] } } }, true],
    ]) {
        const ctx = {
            client: { music: manager },
            // Si requireMusic aprueba con un nodo caído, el fake reply tira y
            // el test falla. Así un approve-on incorrecto no pasa inadvertido.
            reply: async () => { throw new Error('respondió cuando debía rechazar'); },
        };
        const r = await Promise.race([
            Promise.resolve().then(() => checks.requireMusic(ctx)).catch(e => e),
            new Promise(res => setTimeout(() => res('timeout'), 100)),
        ]);
        if (r === esperado) pass++;
        else { problems.push(`requireMusic: ${nombre} devolvió ${r}, esperaba ${esperado}`); fail++; }
    }

    // liveNode: con el nodeResolver de Shoukaku y con el fallback propio.
    if (checks.liveNode({ shoukaku: { nodes: { size: 1, values: () => [{ state: 1, name: 'n1' }] }, nodeResolver: () => ({ name: 'n1' }) } })?.name === 'n1'
        && checks.liveNode({ shoukaku: { nodes: { size: 1, values: () => [{ state: 1, name: 'n1' }] } } })?.name === 'n1'
        && checks.liveNode({ shoukaku: { nodes: { size: 0 } } }) === null
        && checks.liveNode(null) === null) pass++;
    else { problems.push('liveNode: no encuentra el nodo conectado, o no devuelve null sin nodos'); fail++; }

    if (checks.isNoNodeError(new Error('No node found')) && checks.isNoNodeError(new Error('No nodes available'))
        && !checks.isNoNodeError(new Error('Missing Permissions'))) pass++;
    else { problems.push('isNoNodeError: no distingue el error de nodo de otros errores'); fail++; }

    // Sugerencias: el caso real fue `!djjoin`, que no existe. Tiene que
    // sugerir "join", no un alias interno.
    const s1 = suggest('djjoin', canonicales);
    if (s1[0] === 'join') pass++;
    else { problems.push(`suggest("djjoin") dio ${JSON.stringify(s1)}, esperaba que empiece con "join"`); fail++; }

    // Un nombre inventado no debe traer sugerencias: mejor callar que ofrecer
    // tres comandos al azar y que el usuario no sepa cuál era.
    if (suggest('zzzzzqqqx', canonicales).length === 0) pass++;
    else { problems.push('suggest: sugiere comandos para un nombre inventado'); fail++; }

    // Toda sugerencia tiene que ser un comando que existe de verdad.
    for (const malo of ['clera', 'playy', 'volumee', 'invte', 'servinfo']) {
        const s = suggest(malo, canonicales);
        if (s.length && s.every(n => canonicales.has(n))) pass++;
        else { problems.push(`suggest("${malo}") propuso ${JSON.stringify(s)}, alguno no es un comando real`); fail++; }
    }

    if (levenshtein('kitten', 'sitting') === 3) pass++;
    else { problems.push('levenshtein("kitten","sitting") no da 3'); fail++; }
    if (similarity('clear', 'clear') === 1 && similarity('xyzabc', 'clear') < 0.45) pass++;
    else { problems.push('similarity: puntúa mal los extremos'); fail++; }

    // --- Resultado ---
    console.log(`\n===== PANELES: ${pass} OK / ${fail} con error =====`);
    if (problems.length) {
        for (const p of problems) console.log(`  ✖ ${p}`);
        process.exit(1);
    }
    console.log('Todos los paneles migrados cumplen los límites de Discord.');
})();
