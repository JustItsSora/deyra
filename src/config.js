// config.js — commit this. Secrets are read from process.env, never hardcoded here.
require('dotenv').config();

/**
 * Normaliza la URL de Lavalink: Shoukaku quiere "host:puerto" pelado.
 * Si el usuario pega "wss://nodo.com:443" o "https://nodo.com", se le saca
 * el protocolo (y la barra final) para que el cliente no termine armando
 * "wss://wss://nodo.com".
 */
function normalizeLavalinkUrl(raw) {
    const url = String(raw || '').trim();
    return url.replace(/^(wss|ws|https|http):\/\//i, '').replace(/\/+$/, '');
}

/**
 * ¿El nodo va por TLS? Si LAVALINK_SECURE está definido, manda ese valor.
 * Si no, se deduce del protocolo de la URL (wss:// o https:// → seguro).
 */
function lavalinkSecure(rawUrl, rawSecure) {
    if (rawSecure !== undefined && rawSecure !== null && String(rawSecure).trim() !== '') {
        return String(rawSecure).trim().toLowerCase() === 'true';
    }
    return /^(wss|https):\/\//i.test(String(rawUrl || '').trim());
}

module.exports = {
    BOT_TOKEN: process.env.BOT_TOKEN,
    CLIENT_ID: process.env.CLIENT_ID,
    DEV_GUILD_ID: process.env.DEV_GUILD_ID || null,
    DATABASE_PATH: process.env.DATABASE_PATH || './data/deyra.sqlite',
    PREFIX: process.env.PREFIX || '!',
    OWNER_ID: process.env.OWNER_ID || '548170108590358559',

    // API admin para el dashboard web. La app Next.js del panel habla con
    // esta API; sin ADMIN_API_KEY el servidor admin NO arranca (fail-closed).
    ADMIN_API_KEY: process.env.ADMIN_API_KEY || null,
    ADMIN_PORT: Number(process.env.SERVER_PORT || process.env.ADMIN_PORT || 3000),
    DASHBOARD_ORIGIN: process.env.DASHBOARD_ORIGIN || null,

    BOT_NAME: 'Deyra',

    // Identidad de marca. Todo lo que aparece en el pie de los paneles sale de
    // acá (src/lib/ui/theme.js). Lo que dejes vacío simplemente no se muestra,
    // así que el bot se ve bien completo sin tocar nada.
    BRAND: {
        name: 'Deyra',
        tagline: 'Todo en uno para tu servidor',   // se muestra junto a la marca
        inviteUrl: '',                              // ej: https://discord.gg/tuinvite
        supportUrl: '',                             // servidor de soporte
        docsUrl: '',                                // documentación / comandos
    },

    // Color de acento para todos los paneles Components V2 / embeds.
    COLORS: {
        PRIMARY: 0x1E3A5F,   // azul acero oscuro, tono profesional/minimalista
        SUCCESS: 0x57F287,
        ERROR: 0xED4245,
        WARNING: 0xFEE75C,
        NEUTRAL: 0x2B2D31,
    },

    STATUS: {
        status: 'online',
        activityName: '/help · Deyra',
    },

    // Identificación ante las APIs externas.
    //
    // Varias de las que usa el bot (nekos.best, purrbot.site) rechazan las
    // peticiones SIN User-Agent con un 403 explícito, y las que sí lo aceptan
    // bloquean los User-Agent que se hacen pasar por un navegador (está
    // prohibido en sus términos). El formato que piden es:
    //
    //     NombreDeLaApp (contacto)
    //
    // IMPORTANTE: el contacto tiene que ser real. nekos.best rechaza con 403
    // los que parecen de relleno (cualquier cosa con "example", "localhost" o
    // un dominio que no existe de verdad), y también rechazan los emails. Un
    // link a tu repo, tu web o tu página en top.gg funciona.
    //
    // -> Poné el tuyo en la variable de entorno HTTP_CONTACT.
    HTTP: {
        appName: process.env.HTTP_APP_NAME || 'DeyraBot',
        contact: process.env.HTTP_CONTACT || 'https://github.com/ryu/deyra',
    },

    // Cooldown por defecto (ms) para comandos que golpean la DB o una API externa.
    DEFAULT_COOLDOWN_MS: 3000,

    // Discord rechaza el registro en bloque si se supera cierto número de
    // comandos slash de nivel superior (Deyra tiene 400+ comandos "hybrid",
    // muy por encima de eso). MAX_SLASH_COMMANDS limita cuántos se registran
    // como "/" en Discord; el resto sigue funcionando 100% normal como
    // comando de prefijo (no se pierde ninguna función, solo el acceso "/").
    // 100 es el límite documentado de Discord por aplicación/servidor — se
    // deja margen (90) para no rozarlo si en el futuro se agregan comandos
    // "slash-only" adicionales en src/commands/slash.
    MAX_SLASH_COMMANDS: 90,

    // Orden de prioridad para el registro de slash commands. El reparto se
    // hace por turnos entre categorías en este orden (ver registerCommands.js),
    // así que lo quedefine esto es QUIÉN entra primero, no cuánto entra cada
    // uno. Las categorías no listadas entran después de todas.
    //
    // Criterio: qué se pierde menos si un comando queda solo con prefijo.
    // Utilidad y diversión son lo que la gente busca en el menú "/".
    SLASH_CATEGORY_PRIORITY: [
        'utilidad',
        'diversión',
        'moderación',
        'niveles',
        'economía',
        'música',
        'tickets',
        'configuración',
        'owner',
    ],

    // Tope por categoría en el registro de slash. Sin esto, una categoría con
    // muchos comandos (utilidad tiene 221) se lleva una parte desproporcionada
    // de los cupos y el resto no aparece nunca. Un tope de 20 sobre 90 cupos
    // deja lugar para las nueve categorías.
    MAX_SLASH_PER_CATEGORY: 20,

    // Comandos que nunca se recortan, por nombre de slash. Son los que la
    // gente busca por nombre en el menú de "/" sin saber de antemano cómo se
    // llaman.
    //
    // La música entra acá a propósito: con 36 comandos de música y solo 11
    // cupos por categoría, el reparto por turnos dejaba afuera justamente los
    // que más se usan (/filter, /nowplaying, /musicconfig). Con esta lista, la
    // reproducción básica y las funciones nuevas de la fusión quedan
    // siempre disponibles como "/", y el resto sigue entrando por prefijo.
    SLASH_ALWAYS_INCLUDE: [
        'help', 'invite', 'serverinfo', 'userinfo', 'botinfo', 'ping', 'gif',
        // Música: el ciclo básico de reproducción + lo nuevo de la fusión.
        'play', 'pause', 'resume', 'skip', 'queue', 'nowplaying', 'stop',
        'filter', 'musicconfig',
    ],

    // ─────────────────────────────────────────────────────────────────────────
    // IA (chat, resúmenes y segunda opinión del automod)
    //
    // No hay IA gratuita ilimitada: cada proveedor tiene tope diario. Lo que
    // hace src/lib/ai.js es SUMAR las cuotas, tener respaldo en cadena, y
    // cachear, para que el límite no se vea desde el usuario.
    //
    // Las keys van en el .env (GEMINI_API_KEY, GROQ_API_KEY). Pollinations
    // funciona sin key y hace de piso, así que el bot siempre responde algo.
    //
    // Cuotas gratuitas medidas:
    //   Groq    →  1.000 requests/día,  30/min
    //   Gemini  →  1.500 requests/día,  10/min
    // Con los dos: ~2.500 consultas diarias.
    AI: {
        // Orden de preferencia. Groq es el más rápido, Gemini el más preciso.
        // Pollinations va último porque es el único sin key pero también el
        // peor: modelo chico, 6-30s de respuesta y sin límite diario conocido.
        order: (process.env.AI_ORDER || 'groq,gemini,pollinations').split(',').map(s => s.trim()),

        // Poné pollinations:false en el .env si preferís un error honesto a
        // una respuesta floja cuando se acaban las cuotas buenas.
        pollinations: process.env.AI_POLLINATIONS !== 'false',

        // Modelos. Si los borrás se usan las listas de reserva de src/lib/ai.js
        // (que ya prueban el siguiente cuando uno sale del free tier).
        groqModel: process.env.GROQ_MODEL || '',
        geminiModel: process.env.GEMINI_MODEL || '',
        pollinationsModel: process.env.POLLINATIONS_MODEL || 'openai',

        // false = no gastar cuota en el "razonamiento interno" del modelo.
        thinking: false,

        // Modo JSON del proveedor (response_format / responseMimeType). Aparece
        // solo en las peticiones que piden datos estructurados (askJson), que
        // hoy es el veredicto del automod. El refuerzo del system prompt va
        // siempre igual: response_format hace la respuesta parseable, pero no
        // obliga al modelo a no ponerle markdown alrededor.
        jsonMode: process.env.AI_JSON_MODE !== 'false',
    },

    // Módulo de música (Lavalink vía Kazagumo/Shoukaku).
    //
    // IMPORTANTE, medido el 27/09/2026: el nodo público que estaba hardcodeado
    // acá (lavalink.jirayu.net) ya no responde, y tampoco queda ninguno vivo de
    // las listas públicas. Se probaron 54 nodos entre la lista oficial
    // (lavalink-list.darrennathanael.com) y tres listas comunitarias: ninguno
    // respondió /version. DNS y conectividad se descartaron como causa.
    //
    // Por eso NO hay un nodo por defecto. La música arranca apagada y hay que
    // poner LAVALINK_URL / LAVALINK_PASSWORD en el .env. Si no, el bot lo dice
    // claro en cada comando en vez de tirar "No node found".
    //
    // Lavalink es Java y come ~300MB de RAM, así que no puede correr junto al
    // bot en un host de 256MB. Va aparte: una VPS, un contenedor propio, o
    // tu PC con un túnel.
    MUSIC: {
        DEFAULT_SEARCH_ENGINE: 'ytmsearch',
        NODES: process.env.LAVALINK_URL
            ? [{
                name: process.env.LAVALINK_NAME || 'main',
                url: normalizeLavalinkUrl(process.env.LAVALINK_URL),
                auth: process.env.LAVALINK_PASSWORD || '',
                secure: lavalinkSecure(process.env.LAVALINK_URL, process.env.LAVALINK_SECURE),
            }]
            : [],
        // Nodos extra por si querés redundancy. Se pasan separados por coma,
        // con el formato host:port:password. Shoukaku elige el que tenga menos
        // penalización, así que tener dos o tres es una red de seguridad real
        // cuando uno se cae (que es constante: los públicos se caen seguido).
        ...(process.env.LAVALINK_EXTRA_NODES
            ? {
                NODES: [
                    ...(process.env.LAVALINK_URL
                        ? [{
                            name: process.env.LAVALINK_NAME || 'main',
                            url: normalizeLavalinkUrl(process.env.LAVALINK_URL),
                            auth: process.env.LAVALINK_PASSWORD || '',
                            secure: lavalinkSecure(process.env.LAVALINK_URL, process.env.LAVALINK_SECURE),
                        }]
                        : []),
                    ...process.env.LAVALINK_EXTRA_NODES
                        .split(',')
                        .map(s => s.trim())
                        .filter(Boolean)
                        .map((entry, i) => {
                            const [host, port, pass] = entry.split(':');
                            return {
                                name: `extra-${i + 1}`,
                                url: `${host}:${port || 2333}`,
                                auth: pass || '',
                                secure: false,
                            };
                        }),
                ],
            }
            : {}),
        SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID || '',
        SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET || '',

        // ── Votos de top.gg (desbloquean funciones sin cobrar) ───────────────
        // El esquema "votá y te dejo usar X" necesita saber quién votó, y
        // top.gg no avisa: hay que apuntar un webhook a un servidor HTTP propio.
        // Con TOPGG_WEBHOOK_SECRET vacío, el servidor ni arranca (ver
        // src/music/lib/voteWebhook.js).
        VOTES: {
            ENABLED: process.env.TOPGG_VOTES_ENABLED === 'true',
            WEBHOOK_SECRET: process.env.TOPGG_WEBHOOK_SECRET || '',
            PORT: parseInt(process.env.VOTES_WEBHOOK_PORT, 10) || 6969,
            // Link de la página del bot en top.gg.
            //
            // VACÍO a propósito, aunque se pueda adivinar con el CLIENT_ID:
            // hasta que top.gg apruebe el bot, esa URL da 404, y /vote prefiere
            // decir "próximamente" antes que mandar a un error. Cuando lo
            // aprueben, con poner TOPGG_URL en el .env el botón empieza a
            // funcionar: no hay que tocar código.
            URL: process.env.TOPGG_URL || '',
        },
        DEFAULT_VOLUME: 80,
        MAX_QUEUE_SIZE: 500,
        LEAVE_ON_EMPTY_MS: 60000,
        LEAVE_ON_END_MS: 120000,
    },
};
