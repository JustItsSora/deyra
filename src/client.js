// src/client.js — punto de entrada. Orden de boot:
// 1. Preparar el runtime (resolución DNS).
// 2. Crear Client con solo los intents necesarios.
// 3. Cargar comandos y eventos.
// 4. Esperar a que la DB esté lista (fail fast si no).
// 5. Login.
// 6. En clientReady: presence, registro de slash commands, jobs en background.
// 7. Handlers de proceso (unhandledRejection, SIGINT/SIGTERM) — antes del login.

const dns = require('dns');
const path = require('path');
const { Client, GatewayIntentBits, Partials, Collection, MessageFlags, ActivityType } = require('discord.js');
const config = require('./config');
const { loadHybridCommands, loadSlashCommands, loadPrefixCommands } = require('./lib/commandLoader');
const { loadSimpleEvents, loadFeatureEvents, loadInteractionHandlers } = require('./lib/eventLoader');
const { registerCommands } = require('./lib/registerCommands');
const { dbReady } = require('./data/models');
const { isConfigured: emojisConfigured } = require('./lib/emojis');
const { loadMusicManager } = require('./music/musicManager');
const { loadMusicEvents } = require('./music/loadMusicEvents');

// Node 18+ (y 20+) resuelven DNS priorizando IPv6. En la mayoría de los
// servidores de Discord eso está bien, pero en redes hogareñas o en hosts sin
// IPv6_routeado hace que las llamadas a APIs externas fallen con ETIMEDOUT
// aunque la API esté perfectamente viva (a TVmaze le pasa mucho: su único
// registro AAAA no responde).
//
// Forzar IPv4 primero evita ese_timeout sin cambiar nada más.
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,       // privilegiado: bienvenidas, autorole, member count
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,     // privilegiado: comandos de prefijo, automod de texto
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences,     // privilegiado: opcional, usado por algunos comandos de info
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.GuildMember],
});

client.commands = new Collection();       // slash + hybrid (por nombre de slash command)
client.prefixCommands = new Collection(); // prefix + hybrid (por nombre/alias de prefijo)
client.interactionHandlers = null;        // se llena abajo: prefix (customId) -> handler module
client.config = config;

async function bootstrap() {
    // --- 2. Cargar comandos y eventos ---
    loadHybridCommands(client, path.join(__dirname, 'hybrid'));
    loadSlashCommands(client, path.join(__dirname, 'commands', 'slash'));
    loadPrefixCommands(client, path.join(__dirname, 'commands', 'prefix'));

    loadSimpleEvents(client, path.join(__dirname, 'gateway'));
    loadFeatureEvents(client, path.join(__dirname, 'gateway'));
    client.interactionHandlers = loadInteractionHandlers(path.join(__dirname, 'gateway'));

    // Música (Lavalink vía Kazagumo/Shoukaku) — opcional: si no hay nodos
    // configurados en config.MUSIC.NODES, el bot sigue arrancando normal
    // y los comandos de música avisan que el módulo está desactivado.
    loadMusicManager(client);
    loadMusicEvents(client);

    // Webhook de votos de top.gg. Se arranca DESPUÉS de la base (porque al
    // recibir un voto escribe en ella) y solo si hay secreto configurado: sin
    // secreto no se abre ningún puerto.
    if (config.MUSIC?.VOTES?.ENABLED) {
        try {
            client.voteWebhook = require('./music/lib/voteWebhook').startVoteWebhook(client, {
                port: config.MUSIC.VOTES.PORT,
                secret: config.MUSIC.VOTES.WEBHOOK_SECRET,
            });
        } catch (err) {
            console.error('[boot] No se pudo arrancar el webhook de votos:', err.message);
        }
    }

    console.log(`[boot] ${client.commands.size} slash commands cargados.`);
    console.log(`[boot] ${client.prefixCommands.size} entradas de comandos de prefijo cargadas (incluye aliases).`);

    if (!emojisConfigured()) {
        console.warn('[boot] Los emojis de aplicación aún no se han subido. Corre `npm run emojis:upload` y reinicia para usar los emojis reales de Deyra (mientras tanto se usan emojis unicode de reemplazo).');
    }

    // --- 3. DB ---
    try {
        await dbReady;
        console.log('[boot] Base de datos lista.');
    } catch (err) {
        console.error('[boot] No se pudo inicializar la base de datos, abortando:', err);
        process.exit(1);
    }

    // --- 3b. API admin para el dashboard (fail-soft si el puerto está ocupado) ---
    try {
        require('./admin/server').startAdminServer(client);
    } catch (err) {
        console.error('[boot] No se pudo arrancar la API admin:', err.message);
    }

    // --- 6. Handlers de proceso (antes del login) ---
    process.on('unhandledRejection', (reason) => {
        console.error('[process] Unhandled promise rejection:', reason);
    });
    process.on('uncaughtException', (err) => {
        console.error('[process] Uncaught exception:', err);
    });

    async function shutdown(signal) {
        console.log(`[process] Señal ${signal} recibida, cerrando...`);
        try {
            const { sequelize } = require('./data/models');
            await sequelize.close();
        } catch (err) {
            console.error('[process] Error cerrando la DB:', err);
        }
        client.destroy();
        process.exit(0);
    }
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    // --- 4. Login ---
    if (!config.BOT_TOKEN) {
        console.error('[boot] Falta BOT_TOKEN en el .env. No se puede iniciar sesión.');
        process.exit(1);
    }
    await client.login(config.BOT_TOKEN);
}

// --- 5. clientReady ---
client.once('clientReady', async () => {
    console.log(`[ready] Conectado como ${client.user.tag} (${client.guilds.cache.size} servidores).`);

    client.user.setPresence({
        status: config.STATUS.status,
        activities: [{ name: config.STATUS.activityName, type: ActivityType.Watching }],
    });

    await registerCommands(client);

    // Jobs en background: recordatorios, giveaways por vencer, cumpleaños del día.
    require('./lib/backgroundJobs').start(client);
});

bootstrap().catch(err => {
    console.error('[boot] Error fatal durante el arranque:', err);
    process.exit(1);
});

module.exports = client;
