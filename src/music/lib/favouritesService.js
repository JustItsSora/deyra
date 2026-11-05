// src/music/lib/favouritesService.js
//
// Canciones guardadas. Puerto del /favourite del bot de música viejo, donde los
// favoritos vivían en un JSONB dentro de la tabla `music`.
//
// Qué cambia y por qué:
//
//   · Una fila por canción en music_favorites, en vez de un array JSON. Con el
//     JSON no se podía responder "¿cuántas canciones tiene guardadas este
//     usuario?" sin traerse el array entero, ni saber cuándo se agregó cada una
//     (no había fecha), ni saver cuántas veces se guardó la misma.
//   · El par (userId, identifier) es único: /favourite con una canción ya
//     guardada la SACA, en vez de decir "ya está" y dejar al usuario sin forma
//     de borrarla sin un comando aparte. Es el comportamiento que espera todo el
//     mundo y el que ya tenía el bot viejo (toggle).

const { Op } = require('sequelize');
const { MusicFavorite } = require('../../data/models');

/** Normaliza un track a la fila de music_favorites. */
function trackToRow(track, userId) {
    return {
        userId,
        identifier: track.identifier || track.uri || 'desconocida',
        title: (track.title || 'Sin título').slice(0, 250),
        uri: (track.uri || '').slice(0, 500) || null,
        author: (track.author || '').slice(0, 250) || null,
        length: Number.isFinite(track.length) ? track.length : 0,
        thumbnail: (track.thumbnail || track.artworkUrl || '').slice(0, 500) || null,
        source: (track.sourceName || '').slice(0, 40) || null,
    };
}

/** ¿Está guardada? */
async function isFavorite(userId, identifier) {
    if (!userId || !identifier) return false;
    const row = await MusicFavorite.findOne({ where: { userId, identifier } });
    return !!row;
}

/**
 * Toggle: guarda si no estaba, saca si estaba.
 * @returns {Promise<{ saved: boolean, title: string }>}
 */
async function toggleFavorite(track, userId) {
    const row = trackToRow(track, userId);

    const existing = await MusicFavorite.findOne({
        where: { userId, identifier: row.identifier },
    });

    if (existing) {
        await existing.destroy();
        return { saved: false, title: existing.title };
    }

    await MusicFavorite.create(row);
    return { saved: true, title: row.title };
}

/**
 * Agrega sin toggle, para /favourite Guardar (que da error claro si ya está) y
 * para el botón del panel, que siempre guarda y nunca saca.
 */
async function addFavorite(track, userId) {
    const row = trackToRow(track, userId);

    const [created, wasCreated] = await MusicFavorite.findOrCreate({
        where: { userId, identifier: row.identifier },
        defaults: row,
    });

    return { saved: true, alreadyExisted: !wasCreated, title: created.title };
}

async function removeFavorite(userId, identifier) {
    const destroyed = await MusicFavorite.destroy({ where: { userId, identifier } });
    return destroyed > 0;
}

/** Lista paginada de favoritos del usuario. */
async function listFavorites(userId, { page = 0, perPage = 10 } = {}) {
    const { rows, count } = await MusicFavorite.findAndCountAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        limit: perPage,
        offset: page * perPage,
    });
    return { rows, count, page, perPage };
}

async function countFavorites(userId) {
    return MusicFavorite.count({ where: { userId } });
}

/** Borra todos los favoritos (lo usa /privacy borrar-datos). */
async function clearFavorites(userId) {
    return MusicFavorite.destroy({ where: { userId } });
}

/** Busca en los favoritos del usuario (autocomplete de /favourite reproducir). */
async function searchFavorites(userId, term) {
    if (!term) return MusicFavorite.findAll({ where: { userId }, limit: 25 });
    return MusicFavorite.findAll({
        where: {
            userId,
            [Op.or]: [
                { title: { [Op.like]: `%${term}%` } },
                { author: { [Op.like]: `%${term}%` } },
            ],
        },
        limit: 25,
    });
}

module.exports = {
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    listFavorites,
    countFavorites,
    clearFavorites,
    searchFavorites,
    trackToRow,
};
