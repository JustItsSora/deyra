// src/music/lib/history.js
//
// Historial de reproducción persistente.
//
// Antes el historial vivía solo en `player.data.history`: un Map en memoria que
// se borra en cada playerDestroy, o sea que se perdía en cada cambio de
// canción terminada, en cada /stop y en cada reinicio del bot. /history
// mostraba las últimas 20 de la sesión actual y nada más.
//
// Acá cada canción que SONE se escribe en la tabla music_history, así que:
//
//   · /history muestra lo que sonó de verdad, aunque el bot se haya reiniciado
//     o el player se haya recreado;
//   · /previous puede volver a una canción de hace horas;
//   · el prune automático (llamado desde backgroundJobs.js) puede borrar lo
//     viejo.
//
// Decisión: se escribe en playerStart, no en playerEnd. Escribiendo al arrancar,
// "sonó" es un hecho consumado: si el proceso se muere entre que termina la
// canción y que se dispara el evento, la canción igual quedó registrada. Con
// playerEnd habría una ventana de pérdida que en un host chico (donde los
// reinicios son más comunes) se nota.
//
// `recordHistory` nunca tira: una base lenta o caída no puede dejar sin audio a
// un servidor entero.

const { MusicHistory } = require('../../data/models');
const { getMusicConfig } = require('./musicConfig');

// Cuántas filas se conservan por usuario. /history pagina sobre esto.
const MAX_PER_USER = 100;
const MAX_PER_GUILD = 400;

function trackToRow(player, track) {
    return {
        userId: track.requester?.id || null,
        guildId: player.guildId || null,
        identifier: track.identifier || track.uri || 'desconocida',
        title: (track.title || 'Sin título').slice(0, 250),
        uri: (track.uri || '').slice(0, 500) || null,
        author: (track.author || '').slice(0, 250) || null,
        length: Number.isFinite(track.length) ? track.length : 0,
        thumbnail: (track.thumbnail || track.artworkUrl || '').slice(0, 500) || null,
        source: (track.sourceName || '').slice(0, 40) || null,
        playedAt: new Date(),
    };
}

/**
 * Anota una canción como escuchada.
 * @param {object} player
 * @param {object} track
 */
async function recordHistory(player, track) {
    try {
        const settings = await getMusicConfig(player.guildId);
        if (settings.historyEnabled === false) return false;

        const row = trackToRow(player, track);
        await MusicHistory.create(row);

        // Poda por usuario y por servidor. Se hace acá y no en un cron porque
        // el que genera las filas es este código: podar en el mismo lugar evita
        // que la tabla crezca y no depende de que el cron esté andando.
        await pruneForUser(row.userId);
        await pruneForGuild(row.guildId);

        return true;
    } catch (err) {
        console.error('[history] No se pudo guardar:', err.message);
        return false;
    }
}

async function pruneForUser(userId) {
    if (!userId) return;
    const { Op } = require('sequelize');
    const rows = await MusicHistory.findAll({
        where: { userId },
        attributes: ['id'],
        order: [['playedAt', 'DESC']],
        limit: MAX_PER_USER,
    });
    const keep = rows.map((r) => r.id);
    await MusicHistory.destroy({
        where: { userId, id: { [Op.notIn]: keep.length ? keep : [0] } },
    });
}

async function pruneForGuild(guildId) {
    if (!guildId) return;
    const { Op } = require('sequelize');
    const rows = await MusicHistory.findAll({
        where: { guildId },
        attributes: ['id'],
        order: [['playedAt', 'DESC']],
        limit: MAX_PER_GUILD,
    });
    const keep = rows.map((r) => r.id);
    await MusicHistory.destroy({
        where: { guildId, id: { [Op.notIn]: keep.length ? keep : [0] } },
    });
}

/** Últimas N canciones de un usuario (para /history). */
async function getUserHistory(userId, limit = 50) {
    return MusicHistory.findAll({
        where: { userId },
        order: [['playedAt', 'DESC']],
        limit,
    });
}

/** Últimas N canciones de un servidor, de cualquiera (para /recientes). */
async function getGuildHistory(guildId, limit = 50) {
    return MusicHistory.findAll({
        where: { guildId },
        order: [['playedAt', 'DESC']],
        limit,
    });
}

/** Borra el historial de un usuario (lo usa /privacy). */
async function clearUserHistory(userId) {
    const deleted = await MusicHistory.destroy({ where: { userId } });
    return deleted;
}

module.exports = {
    recordHistory,
    getUserHistory,
    getGuildHistory,
    clearUserHistory,
    trackToRow,
    MAX_PER_USER,
    MAX_PER_GUILD,
};
