// src/music/lib/musicConfig.js
//
// Ajustes de música por servidor: el equivalente en Deyra de la tabla `guilds`
// del bot de música viejo (default_volume, autoplay_default, fairplay_default,
// fairplay_mod_role_id, twenty_four_seven + sus dos canales), leída desde el
// modelo Sequelize MusicConfig en vez de PostgreSQL.
//
// Dos cosas que este archivo resuelve y que antes estaban repartidas:
//
//   1. Defaults en un solo lugar. config.MUSIC es la fuente de la verdad
//      cuando el servidor nunca tocó nada; la fila de la base gana después.
//      Por eso cambiar un default en src/config.js NO pisa lo que un admin
//      configuró a mano.
//
//   2. Cache con TTL. Los eventos del reproductor (playerStart, playerEmpty,
//      panel) necesitan leer estos valores, y antes de este archivo leían
//      process.env en cada evento. Con 40 servidores y un cron cada 15 min no
//      es un problema de carga, pero sí lo es de inconsistencia: el mismo
//      ajuste podía dar dos resultados distintos en la misma segundo según de
//      dónde se leyera. Acá se cachea 60s y los comandos que cambian algo
//      invalidan al vuelo.

const config = require('../../config');
const { MusicConfig } = require('../../data/models');

const CACHE_TTL_MS = 60_000;
const cache = new Map(); // guildId -> { settings, at }

/**
 * Convierte una fila de music_configs en el objeto de ajustes que usa el resto
 * del código. Vive acá (y no en línea en cada lugar) porque hay tres sitios que
 * lo necesitan: el getter normal, el job de 24/7 que ya tiene la fila en mano
 * y /musicconfig reset, que reconstruye los defaults desde cero.
 */
function settingsFromRow(row, base = null) {
    const d = base || defaults();
    if (!row) return d;
    return {
        defaultVolume: row.defaultVolume ?? d.defaultVolume,
        defaultAutoplay: row.defaultAutoplay ?? d.defaultAutoplay,
        defaultFairplay: row.defaultFairplay ?? d.defaultFairplay,
        fairplayRoleId: row.fairplayRoleId ?? null,
        twentyFourSeven: row.twentyFourSeven ?? d.twentyFourSeven,
        voice247Id: row.voice247Id ?? null,
        text247Id: row.text247Id ?? null,
        leaveOnEmptyMs: row.leaveOnEmptyMs ?? d.leaveOnEmptyMs,
        leaveOnEndMs: row.leaveOnEndMs ?? d.leaveOnEndMs,
        historyEnabled: row.historyEnabled ?? d.historyEnabled,
        nowPlayingPanel: row.nowPlayingPanel ?? d.nowPlayingPanel,
        maxQueueSize: row.maxQueueSize ?? d.maxQueueSize,
    };
}

/** Defaults tomados de src/config.js (MUSIC). Copia nueva en cada llamada. */
function defaults() {
    const music = config.MUSIC || {};
    return {
        defaultVolume: music.DEFAULT_VOLUME ?? 80,
        defaultAutoplay: false,
        defaultFairplay: false,
        fairplayRoleId: null,
        twentyFourSeven: false,
        voice247Id: null,
        text247Id: null,
        leaveOnEmptyMs: music.LEAVE_ON_EMPTY_MS ?? 60_000,
        leaveOnEndMs: music.LEAVE_ON_END_MS ?? 120_000,
        historyEnabled: true,
        nowPlayingPanel: true,
        maxQueueSize: music.MAX_QUEUE_SIZE ?? 500,
    };
}

/**
 * Ajustes del servidor. SIEMPRE devuelve un objeto completo (nunca null):
 * un servidor sin fila en la base usa los defaults, que es el caso normal.
 *
 * @param {string} guildId
 * @param {{ fresh?: boolean }} [opts] fresh=true ignora la cache (comandos
 *        que están por mostrar el valor actual y necesitan el dato fresco).
 */
async function getMusicConfig(guildId, { fresh = false } = {}) {
    if (!guildId) return defaults();

    const hit = cache.get(guildId);
    if (!fresh && hit && (Date.now() - hit.at) < CACHE_TTL_MS) return hit.settings;

    let settings = defaults();

    try {
        const row = await MusicConfig.findOne({ where: { guildId } });
        if (row) settings = settingsFromRow(row, settings);
    } catch (err) {
        // La base no está disponible no puede voltear la música: se sigue con
        // los defaults y el error queda en consola para que se vea al mirar.
        console.error('[musicConfig] No se pudo leer la config de música:', err.message);
    }

    cache.set(guildId, { settings, at: Date.now() });
    return settings;
}

/**
 * Cambia uno o varios ajustes y los deja visibles al instante.
 * @returns {Promise<object>} los ajustes ya guardados
 */
async function updateMusicConfig(guildId, patch = {}) {
    const [row] = await MusicConfig.findOrCreate({
        where: { guildId },
        defaults: { guildId },
    });

    // Solo campos conocidos: el objeto patch viene de opciones de slash, y una
    // opción mal tipeada no debe crear una columna fantasma en la tabla.
    const allowed = Object.keys(defaults());
    for (const key of allowed) {
        if (Object.prototype.hasOwnProperty.call(patch, key) && patch[key] !== undefined) {
            row[key] = patch[key];
        }
    }

    await row.save();

    const settings = await getMusicConfig(guildId, { fresh: true });
    return settings;
}

/** Olvida la cache de un servidor (o de todos). */
function invalidateMusicConfig(guildId) {
    if (guildId) cache.delete(guildId);
    else cache.clear();
}

/**
 * Vuelca los ajustes del server en `player.data` y devuelve los valores que
 * el reproductor necesita tener a mano.
 *
 * Se llama al crear el player y también en cada evento: los ajustes pueden
 * cambiar con el player ya vivo (un admin activa 24/7 mientras suena), y el
 * player no se entera solo.
 *
 * Decisión: autoplay y fairplay se aplican como DEFAULT, no se pisan. Si el
 * usuario ya hizo /autoplay a mano, se respeta; recién en un player nuevo (o
 * después de un /autoplay off explícito) se realinea con el default del server.
 */
function applySettingsToPlayer(player, settings) {
    if (!player?.data) return;

    player.data.set('musicConfig', settings);
    player.data.set('fairplay', settings.defaultFairplay);
    player.data.set('fairplayRoleId', settings.fairplayRoleId);
    player.data.set('leaveOnEmptyMs', settings.leaveOnEmptyMs);
    player.data.set('leaveOnEndMs', settings.leaveOnEndMs);
    player.data.set('maxQueueSize', settings.maxQueueSize);

    if (!player.data.get('autoplaySetByUser')) {
        player.data.set('autoplay', settings.defaultAutoplay);
    }

    // 24/7 solo aplica al canal configurado. Si el player está en otro canal
    // (alguien lo movió a mano), quedarse solo ahí NO es lo que el admin pidió.
    const in247 = settings.twentyFourSeven
        && settings.voice247Id
        && (!player.voiceId || player.voiceId === settings.voice247Id);
    player.data.set('stay247', in247);

    return {
        autoplay: player.data.get('autoplay'),
        fairplay: settings.defaultFairplay,
        fairplayRoleId: settings.fairplayRoleId,
        stay247: in247,
    };
}

/**
 * ¿Este member puede tocar la reproducción con fairplay activo?
 * Sin fairplay, cualquiera en el canal de voz puede (es lo que espera
 * /pause y compañía). Con fairplay, hace falta el rol configurado.
 */
function fairplayAllows(member, player) {
    const fairplay = player?.data?.get('fairplay');
    if (!fairplay) return true;
    if (!member?.id) return true;

    const roleId = player.data.get('fairplayRoleId');
    if (!roleId) return true;

    // El owner del bot y quien tenga Mute Members administran el server:
    // tienen que poder cortar la música si algo se reproduce mal.
    if (member.id === config.OWNER_ID) return true;
    if (member.permissions?.has?.('MuteMembers')) return true;

    return member.roles?.cache?.has(roleId) || false;
}

module.exports = {
    getMusicConfig,
    settingsFromRow,
    updateMusicConfig,
    invalidateMusicConfig,
    applySettingsToPlayer,
    fairplayAllows,
    defaults,
    CACHE_TTL_MS,
};
