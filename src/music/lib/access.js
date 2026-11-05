// src/music/lib/access.js
//
// Premium y votos: qué puede usar cada persona.
//
// Es el mismo esquema del bot de música viejo, con los mismos números de
// límites (ver LIMITS abajo), pero con una diferencia de fondo: el bot viejo
// tenía un tier 'owner' que le daba TODO gratis, y el premium se compraba por
// webhook (que nunca estuvo configurado, así que en la práctica el premium era
// código muerto). Acá:
//
//   · el owner (config.OWNER_ID) tiene acceso total sin necesidad de fila en la
//     base, y eso se comprueba con una línea y no con una consulta a la base;
//   · los límites se aplican igual para todos, premium o no: la idea es
//     simplificar, no mantener una lista de excepciones por categoría que nadie
//     va a revisar nunca.
//
// LÍMITES (copiados del bot viejo a propósito, son valores razonables):
//   free    →  5 playlists, 25 canciones por playlist, 15 favoritos, 50 de historial
//   premium → 15 playlists, 50 canciones por playlist, 50 favoritos, 200 de historial
//
// Lo que NO está limitado: la cola de reproducción, los filtros y el 24/7. Son
// las funciones que hacen que el bot sea usable, y ponerles un límite
// convierte al bot en una demo.

const { UserPremium, GuildPremium, MusicVote } = require('../../data/models');
const config = require('../../config');

const LIMITS = {
    free: { playlists: 5, playlistSongs: 25, favourites: 15, history: 50 },
    premium: { playlists: 15, playlistSongs: 50, favourites: 50, history: 200 },
};

const TIERS = {
    lite: { label: 'Lite', serverActivations: 0 },
    basic: { label: 'Standard', serverActivations: 1 },
    premium: { label: 'Ultra', serverActivations: 2 },
};

/** ¿Es el owner del bot? (tiene todos los límites abiertos) */
function isBotOwner(userId) {
    return !!userId && userId === config.OWNER_ID;
}

/**
 * Premium de usuario.
 * @returns {Promise<{tier: string, serverActivations: number, expiresAt: Date|null}|null>}
 */
async function getUserPremium(userId) {
    if (!userId) return null;
    try {
        const row = await UserPremium.findOne({ where: { userId } });
        if (!row) return null;

        // Vencido = no premium. Se borra la fila en vez de dejarla: un premium
        // vencido que sigue en la base hace que /premium mienta y que el conteo
        // de activaciones dé mal.
        if (row.expiresAt && new Date(row.expiresAt) < new Date()) {
            await UserPremium.destroy({ where: { userId } }).catch(() => {});
            return null;
        }

        return {
            tier: row.tier,
            serverActivations: row.serverActivations ?? TIERS[row.tier]?.serverActivations ?? 0,
            expiresAt: row.expiresAt,
        };
    } catch (err) {
        console.error('[access] No se pudo leer el premium:', err.message);
        return null;
    }
}

async function hasUserPremium(userId) {
    if (isBotOwner(userId)) return true;
    return !!(await getUserPremium(userId));
}

async function getServerPremium(guildId) {
    if (!guildId) return null;
    try {
        const row = await GuildPremium.findOne({ where: { guildId } });
        if (!row) return null;
        if (row.expiresAt && new Date(row.expiresAt) < new Date()) {
            await GuildPremium.destroy({ where: { guildId } }).catch(() => {});
            return null;
        }
        return { activatedBy: row.activatedBy, expiresAt: row.expiresAt };
    } catch (err) {
        console.error('[access] No se pudo leer el premium del server:', err.message);
        return null;
    }
}

async function hasServerPremium(guildId) {
    return !!(await getServerPremium(guildId));
}

/** Premium de usuario O de server (para /premium y los avisos). */
async function hasAnyPremium(userId, guildId) {
    if (isBotOwner(userId)) return true;
    return (await hasUserPremium(userId)) || (await hasServerPremium(guildId));
}

/**
 * ¿Este usuario tiene algún premium? Es lo que decide los límites.
 * El owner siempre pasa.
 */
async function isPremium(userId) {
    if (isBotOwner(userId)) return true;
    return hasUserPremium(userId);
}

/** Los límites que aplican a este usuario ahora mismo. */
async function limitsFor(userId) {
    return (await isPremium(userId)) ? { ...LIMITS.premium } : { ...LIMITS.free };
}

/**
 * ¿Este usuarioZXJ votó en top.gg dentro de la ventana?
 *
 * El voto de top.gg dura 12 horas (es el valor que manda su webhook en
 * expires_at), así que "votó hoy" no alcanza: un voto de ayer a la noche
 * bloqueaba al usuario hasta la tarde.
 */
const VOTE_WINDOW_MS = 12 * 60 * 60 * 1000;

async function hasVotedRecently(userId) {
    if (!userId) return false;
    try {
        const row = await MusicVote.findOne({ where: { userId } });
        if (!row?.expiresAt) return false;
        return new Date(row.expiresAt) > new Date();
    } catch (err) {
        return false;
    }
}

/**
 * Gate de funciones con voto/premium, como el middleware LinkGate del bot
 * viejo. Por ahora no lo usa nadie: quedó para cuando se agreguen funciones
 * limitadas más adelante, y para que el próximo que las escriba no tenga que
 * inventar el chequeo.
 */
async function hasVotedOrPremium(userId) {
    if (isBotOwner(userId)) return true;
    return (await hasAnyPremium(userId)) || (await hasVotedRecently(userId));
}

/**
 * Explica un límite alcanzado: dice cuál es el tope, cuánto llevás y qué
 * cambia con premium. Devuelve null cuando NO hay límite pendiente, para que el
 * comando pueda hacer:
 *
 *     const aviso = limitMessage('playlists', total, premium);
 *     if (aviso) return reply(ctx, { ...warningPanel(...), ephemeral: true });
 *
 * El tope que se mira depende de si la persona tiene premium, no del premium
 * como "castigo": sin premium se compara contra el tope gratis, y con premium
 * no se compara nada (o sea, no hay límite en la práctica).
 *
 * @param {string} kind  playlists | playlistSongs | favourites | history
 * @param {number} used  cuántas hay ahora
 * @param {boolean} isPremiumUser
 * @returns {string|null} null si no se alcanzó ningún límite
 */
function limitMessage(kind, used, isPremiumUser) {
    if (isPremiumUser) return null;

    const cap = LIMITS.free[kind];
    if (cap === undefined || used < cap) return null;

    const labels = {
        playlists: 'playlists',
        playlistSongs: 'canciones por playlist',
        favourites: 'canciones guardadas',
        history: 'canciones en el historial',
    };
    const label = labels[kind] || kind;

    return `El límite gratis es **${cap} ${label}** y ya llegaste. `
        + `Con premium (o votando en top.gg) el límite sube a **${LIMITS.premium[kind]}**, `
        + 'y lo que ya tenés no se borra.';
}

module.exports = {
    LIMITS,
    TIERS,
    isBotOwner,
    getUserPremium,
    hasUserPremium,
    getServerPremium,
    hasServerPremium,
    hasAnyPremium,
    isPremium,
    limitsFor,
    hasVotedRecently,
    hasVotedOrPremium,
    limitMessage,
    VOTE_WINDOW_MS,
};
